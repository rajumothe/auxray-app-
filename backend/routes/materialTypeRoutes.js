const express = require('express');
const router = express.Router();
const materialTypeController = require('../controllers/materialTypeController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/rbacMiddleware');

const ADMIN_ROLES = ['HOD', 'State Head'];

router.get('/', verifyToken, materialTypeController.getAllMaterialTypes);
router.post('/', verifyToken, authorizeRoles(...ADMIN_ROLES), materialTypeController.createMaterialType);

module.exports = router;