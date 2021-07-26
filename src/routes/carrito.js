const { Router } = require('express');
const router = Router();
const verifyAuth = require('../middlewares/verifyAuth');

const CarritoController = require('../controllers/CarritoController');

router.get('/carritos', CarritoController.getAllCarritos);
router.get('/carritos/:id', CarritoController.getCarritoById);
router.get('/users/:id/carritos', CarritoController.getUserCarritos);
router.post('/carritos', CarritoController.createCarrito);
router.put('/carritos/:id', CarritoController.updateCarrito);
router.delete('/carritos/:id', CarritoController.deleteCarrito);

module.exports = router;