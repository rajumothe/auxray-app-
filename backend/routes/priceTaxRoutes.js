const express = require('express');
const router = express.Router();
const priceTaxController = require('../controllers/priceTaxController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/rbacMiddleware');

const ADMIN_ROLES = ['HOD', 'State Head'];
const ALL_EMPLOYEES = ['HOD', 'State Head', 'RSM', 'ASM', 'Executive', 'Technician'];

// Pricing endpoints
router.get('/prices', verifyToken, authorizeRoles(...ALL_EMPLOYEES), priceTaxController.getAllPrices);
router.post('/prices', verifyToken, authorizeRoles(...ADMIN_ROLES), priceTaxController.createPriceRule);

// Tax matrix endpoints
router.get('/taxes', verifyToken, authorizeRoles(...ALL_EMPLOYEES), priceTaxController.getAllTaxes);
router.post('/taxes', verifyToken, authorizeRoles(...ADMIN_ROLES), priceTaxController.createTaxRule);

module.exports = router;