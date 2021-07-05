const jwt = require('jsonwebtoken')

// Middleware para validar el token (rutas protegidas)
function verifyToken(req, res, next) {
    const token = req.headers.authorization
    // Se verifica si el request posee el header authorization
    if (!token) return res.status(403).json({ error: 'No token provided.' })
    try {
        const verified = jwt.verify(token, process.env.TOKEN_SECRET)
        req.user = verified
        // Continuamos
        next()
    } catch (error) {
        res.status(400).json({ error: 'Invalid token' })
    }
}

// Middleware para validar el rol del usuario
function verifyAuth(roles = []) {
    return [
        verifyToken,
        async (req, res, next) => {
            const { user } = req;

            if (!user || (roles.length && !roles.includes(user.role))) {
                // El usuario no existe o no tiene el rol necesario
                return res.status(401).json({ message: 'Unauthorized' });
            }

            // autorización exitosa
            next();
        }
    ];
}

module.exports = verifyAuth;