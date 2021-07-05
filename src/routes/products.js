const { Router } = require('express');
const router = Router();
const verifyAuth = require('../middlewares/verifyAuth');

const ProductController = require('../controllers/ProductController');

router.get('/products', ProductController.getAllProducts);
router.get('/products/:id', ProductController.getProductById);
router.get('/users/:id/products', ProductController.getUserProducts);
router.post('/products', verifyAuth(), ProductController.createProduct);
router.put('/products/:id', verifyAuth(), ProductController.updateProduct);
router.delete('/products/:id', verifyAuth(), ProductController.deleteProduct);

module.exports = router;