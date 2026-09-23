const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middlewares/authMiddleware');

// Ruta de login (pública)
router.post('/login', authController.login);

// Rutas protegidas (requieren autenticación)
router.get('/verify', authenticateToken, authController.verifyToken);
router.post('/change-password', authenticateToken, authController.changePassword);
router.post('/create-admin', authenticateToken, authController.createAdmin);

module.exports = router;
