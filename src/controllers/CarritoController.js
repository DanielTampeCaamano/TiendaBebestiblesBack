const Carrito = require('../models/Carrito');
const { carritoSchema } = require('../helpers/joi/schemaValidate');

// Obtener todos los documentos
const getAllCarritos = async (req, res) => {
  try {
    const carritos = await Carrito.find().populate("user", "firstName lastName -_id");
    res.json(carritos);
  } catch (error) {
    return res.status(400).json({ error })
  }
};

// Obtener todos los carros de un usuario
const getUserCarritos = async (req, res) => {
  try {
    const carritos = await Carrito.find({ user: req.params.id }).populate("user", "firstName lastName -_id");
    res.json(carritos);
  } catch (error) {
    return res.status(400).json({ error })
  }
};

// Agregar un carro
const createCarrito = async (req, res) => {
  try {
    const { error } = carritoSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });
    const newCarrito = await Carrito.create({ ...req.body, user: req.user.id });
    res.status(201).send(newCarrito);
  } catch (error) {
    res.status(500).send({ error });
  }
};

// Obtener un documento en específico
const getCarritoById = async (req, res) => {
  try {
    const carrito = await Carrito.findOne({ _id: req.params.id }).populate("user", "firstName lastName -_id");
    return res.json(carrito);
  } catch (error) {
    return res.status(400).json({ error })
  }
};

// Actualizar una carro
const updateCarrito = async (req, res) => {
  try {
    const { error } = carritoSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    // Obtenemos el usuario y comprobamos que sea el que esta realizando la petición
    const carritoDB = await Carrito.findOne({ _id: req.params.id });
    if (req.user.id !== carritoDB.user) {
      return res.status(400).json({ error: 'No eres el creador de este carro' })
    }

    const carrito = await Carrito.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(carrito);
  } catch (error) {
    return res.status(400).json({ error })
  }
};

// Eliminar un carro
const deleteCarrito = async (req, res) => {
  try {
    const carritoDB = await Carrito.findOne({ _id: req.params.id });
    if (!carritoDB) {
      return res.status(404).json({ error: "Carro no encontrado" })
    }
    // Obtenemos el usuario y comprobamos que sea el que esta realizando la petición
    if (req.user.id !== carritoDB.user.toString()) {
      return res.status(400).json({ error: 'No eres el creador de este Carro' })
    }

    await Carrito.findByIdAndDelete(req.params.id);
    res.status(204);
  } catch (error) {
    return res.status(400).json({ error })
  }
};

module.exports = {
  createCarrito,
  getAllCarritos,
  getCarritoById,
  updateCarrito,
  deleteCarrito,
  getUserCarritos
};