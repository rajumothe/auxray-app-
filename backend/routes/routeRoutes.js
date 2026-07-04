const express = require('express');
const router = express.Router();
const routeController = require('../controllers/routeController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/rbacMiddleware');

const ADMIN_ROLES = ['HOD', 'State Head'];
const ALL_EMPLOYEES = ['HOD', 'State Head', 'RSM', 'ASM', 'Executive', 'Technician'];

router.get('/', verifyToken, authorizeRoles(...ALL_EMPLOYEES), routeController.getAllRoutes);
router.post('/', verifyToken, authorizeRoles(...ADMIN_ROLES), routeController.createRoute);
router.put('/:id', verifyToken, authorizeRoles(...ADMIN_ROLES), routeController.updateRoute);
router.delete('/:id', verifyToken, authorizeRoles(...ADMIN_ROLES), routeController.deactivateRoute);

module.exports = router;