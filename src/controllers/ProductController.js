const Product = require('../models/Product');
const { productSchema } = require('../helpers/joi/schemaValidate');

// Obtener todos los documentos
const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find().populate("user", "firstName lastName -_id");
    res.json(products);
  } catch (error) {
    return res.status(400).json({ error })
  }
};

// Obtener todos los productos de un usuario
const getUserProducts = async (req, res) => {
  try {
    const products = await Product.find({ user: req.params.id }).populate("user", "firstName lastName -_id");
    res.json(products);
  } catch (error) {
    return res.status(400).json({ error })
  }
};

// Agregar un producto
const createProduct = async (req, res) => {
  try {
    const { error } = productSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });
    const newProduct = await Product.create({ ...req.body, user: req.user.id });
    res.status(201).send(newProduct);
  } catch (error) {
    res.status(500).send({ error });
  }
};

// Obtener un documento en específico
const getProductById = async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id }).populate("user", "firstName lastName -_id");
    return res.json(product);
  } catch (error) {
    return res.status(400).json({ error })
  }
};

// Actualizar una producto
const updateProduct = async (req, res) => {
  try {
    const { error } = productSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    // Obtenemos el usuario y comprobamos que sea el que esta realizando la petición
    const productDB = await Product.findOne({ _id: req.params.id });
    if (req.user.id !== productDB.user) {
      return res.status(400).json({ error: 'No eres el creador de este producto' })
    }

    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(product);
  } catch (error) {
    return res.status(400).json({ error })
  }
};

// Eliminar un producto
const deleteProduct = async (req, res) => {
  try {
    const productDB = await Product.findOne({ _id: req.params.id });
    if (!productDB) {
      return res.status(404).json({ error: "Producto no encontrado" })
    }
    // Obtenemos el usuario y comprobamos que sea el que esta realizando la petición
    if (req.user.id !== productDB.user.toString()) {
      return res.status(400).json({ error: 'No eres el creador de este producto' })
    }

    await Product.findByIdAndDelete(req.params.id);
    res.status(204);
  } catch (error) {
    return res.status(400).json({ error })
  }
};

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getUserProducts
};