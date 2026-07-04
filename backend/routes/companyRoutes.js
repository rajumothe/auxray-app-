const express = require('express');
const router = express.Router();
const companyController = require('../controllers/companyController');

// Import Security Middlewares
const { verifyToken } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/rbacMiddleware');

// Define who can do what
const ADMIN_ROLES = ['HOD', 'State Head']; // Only high-level management can edit configs
const ALL_EMPLOYEES = ['HOD', 'State Head', 'RSM', 'ASM', 'Executive', 'Technician'];

// --- Routes ---

// GET: Anyone logged in can view the companies
router.get('/', verifyToken, authorizeRoles(...ALL_EMPLOYEES), companyController.getAllCompanies);

// POST: Only HOD & State Head can create a new company
router.post('/', verifyToken, authorizeRoles(...ADMIN_ROLES), companyController.createCompany);

// PUT: Only HOD & State Head can edit
router.put('/:id', verifyToken, authorizeRoles(...ADMIN_ROLES), companyController.updateCompany);

// DELETE: Only HOD & State Head can deactivate
router.delete('/:id', verifyToken, authorizeRoles(...ADMIN_ROLES), companyController.deactivateCompany);

module.exports = router;