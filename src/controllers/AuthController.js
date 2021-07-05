const fs = require('fs');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Role = require('../helpers/role');
const { sendPasswordResetEmail } = require('../helpers/mail/templates');
const { fullURL, randomTokenString } = require('../helpers/utils');
const { schemaRegister, schemaLogin, schemaBasicData, schemaUpdatePassword, forgotPasswordSchema, resetPasswordSchema } = require('../helpers/joi/schemaValidate');

async function register(req, res) {
    // Validamos que los datos cumplen con la estructura del schemaRegister
    const { error } = schemaRegister.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    // Validamos que el email no se encuentra en nuestra base de datos
    const isEmailExist = await User.findOne({ email: req.body.email });
    if (isEmailExist) {
        return res.status(400).json({ error: 'Email ya registrado' })
    }

    // Encriptamos la contraseña
    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash(req.body.password, salt);

    const newUser = new User({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        avatar: fullURL(req) + '/public/avatar/default.png',
        email: req.body.email,
        password: password,
    })

    // El primer usuario que se registre tendra el rol de Admin
    const isFirstUser = (await User.countDocuments({})) === 0;
    newUser.role = isFirstUser ? Role.Admin : Role.User;

    User.create(newUser).then(() => {
        res.status(201).send('Registro exitoso');
    }).catch(error => {
        res.status(400).send({ error });
    })
}

async function login(req, res) {
    // Validamos los datos
    const { error } = schemaLogin.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    // Buscamos el usuario en la base de datos
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    if (!user.isVerified) return res.status(400).json({ error: 'Revisa tu correo electrónico para verificar tu cuenta' });

    const validPassword = await bcrypt.compare(req.body.password, user.password);
    if (!validPassword) return res.status(400).json({ error: 'Contraseña incorrecta' });

    // Se crea el token
    const token = jwt.sign({
        id: user._id,
        email: user.email,
        role: user.role,
    },
        process.env.TOKEN_SECRET,
        { expiresIn: 60 * 60 * 24 * 30 }
    ); // Expira en 30 días

    res.json({ user: user, token });
}

async function updateProfile(req, res) {
    // Validamos que los datos cumplen con la estructura
    const { firstName, lastName, email } = req.body;
    const { error } = schemaBasicData.validate({ firstName, lastName, email });
    if (error) return res.status(400).json({ error: error.details[0].message });

    // Obtenemos el usuario y comprobamos que sea el que esta realizando la petición
    const user = await User.findById(req.params.id);
    if (`${user._id}` !== req.params.id) {
        return res.status(400).json({ error: 'Unauthorized' })
    }

    // Validamos que el email no se encuentra en nuestra base de datos
    if (user.email !== email && await User.findOne({ email })) {
        return res.status(400).json({ error: 'El email ingresado ya se encuentra en nuestros registros' })
    }

    // Copiamos los parámetros al usuario y guardamos
    Object.assign(user, { firstName, lastName, email, updated: Date.now() });
    await user.save();

    return res.json({ user });
}

async function updatePassword(req, res) {
    // Validamos que los datos cumplen con la estructura
    const { oldPassword, newPassword, repeatPassword } = req.body;
    const { error } = schemaUpdatePassword.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    // Obtenemos el usuario y comprobamos que sea el que esta realizando la petición
    const currentUser = await User.findById(req.params.id);
    if (`${currentUser._id}` !== req.params.id) {
        return res.status(401).json({ error: 'Unauthorized' })
    }
    const validPassword = await bcrypt.compare(oldPassword, currentUser.password);
    if (!validPassword) return res.status(400).json({ error: 'Contraseña incorrecta' });
    if (newPassword !== repeatPassword) return res.status(400).json({ error: 'Las contraseñas no son identicas' });

    // Encriptamos la contraseña
    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash(newPassword, salt);

    // copy params to user and save
    currentUser.password = password;
    currentUser.updated = Date.now();
    await currentUser.save();

    res.json({ user: currentUser });
}

async function updateAvatar(req, res) {
    try {
        if (!req.files) {
            res.status(400).send({ error: 'No se han cargado archivos' });
        } else {
            // Obtenemos el usuario y comprobamos que sea el que esta realizando la petición
            const currentUser = await User.findById(req.params.id);
            if (`${currentUser._id}` !== req.params.id) {
                return res.status(401).json({ error: 'Unauthorized' })
            }

            // Guardamos el archivo en la variable avatar
            const avatar = req.files.avatar;

            // Eliminamos la imagen anterior (En caso de que no sea la por defecto)
            // A su vez validamos que exista la imagen
            if (currentUser.avatar !== 'default.jpg' && fs.existsSync(currentUser.avatar)) {
                fs.unlinkSync('src/public/avatar/' + currentUser.avatar)
            }

            // Usamos el metodo mv() para mover el archivo al directorio pubic/avatar
            // Utilizamos el id único del usuario para evitar conflictos con los nombres al subir un archivo
            avatar.mv('src/public/avatar/' + currentUser._id + avatar.name);

            // Actualizamos el usuario y guardarmos
            currentUser.avatar = `${fullURL(req)}/public/avatar/${currentUser._id}${avatar.name}`;
            currentUser.updated = Date.now();
            await currentUser.save();

            res.json({ user: currentUser });
        }
    } catch (error) {
        res.status(400).json({ error });
    }
}

async function forgotPassword(req, res) {
    try {
        const { error } = forgotPasswordSchema.validate(req.body);
        if (error) return res.status(400).json({ error: error.details[0].message });
        // Buscamos el usuario en la base de datos
        const user = await User.findOne({ email: req.body.email });
        if (!user) return res.status(400).json({ error: 'Usuario no encontrado' });

        // Creamos un token para resetear la contraseña que expira en 24 horas
        user.resetToken = {
            token: randomTokenString(),
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000)
        };
        await user.save();

        // Enviar correo con la información
        await sendPasswordResetEmail(user, req.get('origin'));

        res.json({ message: 'Por favor, revisa tu correo electrónico para ver las instrucciones a seguir para restablecer la contraseña' });
    } catch (error) {
        res.status(400).json({ error });
    }
}

async function resetPassword(req, res) {
    try {
        const { token, password, confirmPassword } = req.body;
        const { error } = resetPasswordSchema.validate({ token, password, confirmPassword });
        if (error) return res.status(400).json({ error: error.details[0].message });
        if (password !== confirmPassword) return res.status(400).json({ error: 'Las contraseñas no son identicas' });

        // Buscamos el usuario en la base de datos
        // $gt - greater than - mayor que
        const currentUser = await User.findOne({
            'resetToken.token': token, // Buscamos el token
            'resetToken.expires': { $gt: Date.now() } // Comprobamos que la fecha de expiración del token es mayor que la fecha actual
        });
        if (!currentUser) return res.status(400).json({ error: 'Token inválido' });

        // Encriptamos la contraseña
        const salt = await bcrypt.genSalt(10);
        const newPassword = await bcrypt.hash(password, salt);

        // Actualizamos los parámetros y guardamos
        currentUser.password = newPassword;
        currentUser.updated = Date.now();
        currentUser.resetToken = undefined; // Al dejar el parámetro resetToken como indenifido este es removido del documento
        await currentUser.save();

        res.json({ message: 'Contraseña restablecida con éxito' });
    } catch (error) {
        res.status(400).json({ error });
    }
}

async function verifyEmail(req, res) {
    const { token, password, confirmPassword } = req.body;
    const { error } = resetPasswordSchema.validate({ token, password, confirmPassword });
    if (error) return res.status(400).json({ error: error.details[0].message });

    const user = await User.findOne({ verificationToken: token });
    if (!user) return res.status(400).json({ error: 'Token inválido' });
    if (password !== confirmPassword) return res.status(400).json({ error: 'Las contraseñas no son identicas' });

    // Encriptamos la contraseña
    const salt = await bcrypt.genSalt(10);
    const userPassword = await bcrypt.hash(password, salt);

    Object.assign(user, { isVerified: true, password: userPassword, verificationToken: undefined });
    await user.save();

    res.json({ message: 'Verificación éxitosa, ahora puedes Iniciar Sesión' });
}

module.exports = {
    register,
    login,
    updateProfile,
    updatePassword,
    updateAvatar,
    forgotPassword,
    resetPassword,
    verifyEmail,
}