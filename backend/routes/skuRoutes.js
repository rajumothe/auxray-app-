const express = require('express');
const router = express.Router();
const skuController = require('../controllers/skuController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/rbacMiddleware');

const ADMIN_ROLES = ['HOD', 'State Head'];
const ALL_EMPLOYEES = ['HOD', 'State Head', 'RSM', 'ASM', 'Executive', 'Technician'];

router.get('/', verifyToken, authorizeRoles(...ALL_EMPLOYEES), skuController.getAllSKUs);
router.post('/', verifyToken, authorizeRoles(...ADMIN_ROLES), skuController.createSKU);
router.put('/:id', verifyToken, authorizeRoles(...ADMIN_ROLES), skuController.updateSKU);
router.delete('/:id', verifyToken, authorizeRoles(...ADMIN_ROLES), skuController.deactivateSKU);

module.exports = router;