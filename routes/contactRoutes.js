const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const { authenticateToken } = require('../middlewares/authMiddleware');

// Ruta pública para enviar mensaje de contacto
router.post('/', contactController.createContact);

// Rutas protegidas (solo admin)
router.get('/', authenticateToken, contactController.getAllContacts);
router.put('/:id/read', authenticateToken, contactController.markAsRead);
router.delete('/:id', authenticateToken, contactController.deleteContact);

module.exports = router;
