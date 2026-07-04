const express = require('express');
const router = express.Router();
const salesOfficeController = require('../controllers/salesOfficeController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/rbacMiddleware');

const ADMIN_ROLES = ['HOD', 'State Head'];
const ALL_EMPLOYEES = ['HOD', 'State Head', 'RSM', 'ASM', 'Executive', 'Technician'];

router.get('/', verifyToken, authorizeRoles(...ALL_EMPLOYEES), salesOfficeController.getAllSalesOffices);
router.post('/', verifyToken, authorizeRoles(...ADMIN_ROLES), salesOfficeController.createSalesOffice);
router.put('/:id', verifyToken, authorizeRoles(...ADMIN_ROLES), salesOfficeController.updateSalesOffice);
router.delete('/:id', verifyToken, authorizeRoles(...ADMIN_ROLES), salesOfficeController.deactivateSalesOffice);

module.exports = router;