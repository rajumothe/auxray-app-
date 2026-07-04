// Inside routes/plantRoutes.js
const express = require('express');
const router = express.Router();
const plantController = require('../controllers/plantController');
const { verifyToken } = require('../middlewares/authMiddleware');

// 🌟 Make sure verifyToken is sitting in front of these endpoints!
router.post('/', verifyToken, plantController.createPlant);
router.get('/', verifyToken, plantController.getAllPlants);
router.put('/:id', verifyToken, plantController.updatePlant);
router.delete('/:id', verifyToken, plantController.deactivatePlant);

module.exports = router;