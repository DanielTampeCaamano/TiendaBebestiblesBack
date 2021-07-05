const { Router } = require('express');
const router = Router();

const AuthController = require('../controllers/AuthController');
const verifyAuth = require('../middlewares/verifyAuth');

router.post('/auth/register', AuthController.register);
router.post('/auth/login', AuthController.login);
router.post('/auth/forgot-password', AuthController.forgotPassword);
router.post('/auth/reset-password', AuthController.resetPassword);
router.post('/auth/verify-email', AuthController.verifyEmail);
router.put('/auth/profile/:id', verifyAuth(), AuthController.updateProfile);
router.put('/auth/password/:id', verifyAuth(), AuthController.updatePassword);
router.post('/auth/avatar/:id', verifyAuth(), AuthController.updateAvatar);

module.exports = router;