const express = require('express');
const router = express.Router();
const webListController = require('../controllers/webListController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/rbacMiddleware');

const WEB_ROLES = ['HOD', 'State Head', 'RSM', 'ASM', 'Executive', 'Technician', 'Back Office'];

router.get('/customers', verifyToken, authorizeRoles(...WEB_ROLES), webListController.getCustomerList);
router.get('/leads', verifyToken, authorizeRoles(...WEB_ROLES), webListController.getLeadList);
router.get('/attendance', verifyToken, authorizeRoles(...WEB_ROLES), webListController.getAttendanceList);
router.get('/visits', verifyToken, authorizeRoles(...WEB_ROLES), webListController.getVisitList);

module.exports = router;
