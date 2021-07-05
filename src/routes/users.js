const { Router } = require('express');
const router = Router();

const Role = require('../helpers/role');
const UserController = require('../controllers/UserController');
const verifyAuth = require('../middlewares/verifyAuth');

router.post('/users', verifyAuth([Role.Admin]), UserController.create);
router.get('/users', verifyAuth([Role.Admin]), UserController.getAll);
router.get('/users/:id', verifyAuth([Role.Admin]), UserController.getById);
router.delete('/users/:id', verifyAuth([Role.Admin]), UserController.deleteUser);

module.exports = router;