const express = require('express');
const router = express.Router();
const tourController = require('../controllers/tourController');
const { authenticateToken } = require('../middlewares/authMiddleware');
const upload = require('../config/upload');

// Rutas públicas (no requieren autenticación)
router.get('/', tourController.getAllTours);
router.get('/active', tourController.getActiveTours);
router.get('/stats', authenticateToken, tourController.getTourStats);
router.get('/:id', tourController.getTourById);

// Rutas protegidas (requieren autenticación de admin)
router.post('/', authenticateToken, upload.single('image'), tourController.createTour);
router.put('/:id', authenticateToken, upload.single('image'), tourController.updateTour);
router.delete('/:id', authenticateToken, tourController.deleteTour);

module.exports = router;
