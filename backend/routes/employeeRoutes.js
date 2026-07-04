const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/rbacMiddleware');

const ADMIN_ROLES = ['HOD', 'State Head'];
const ALL_EMPLOYEES = ['HOD', 'State Head', 'RSM', 'ASM', 'Executive', 'Technician'];

router.get('/', verifyToken, authorizeRoles(...ALL_EMPLOYEES), employeeController.getAllEmployees);
router.get('/report', verifyToken, authorizeRoles(...ALL_EMPLOYEES), employeeController.getEmployeeReport);
router.post('/', verifyToken, authorizeRoles(...ADMIN_ROLES), employeeController.createEmployee);
router.put('/:id', verifyToken, authorizeRoles(...ADMIN_ROLES), employeeController.updateEmployee);
router.delete('/:id', verifyToken, authorizeRoles(...ADMIN_ROLES), employeeController.deactivateEmployee);

module.exports = router;