const mobileLeadController = require('../controllers/mobileLeadController');

// Lead Capturing and Structuring Tracks
router.post('/leads', verifyToken, mobileLeadController.createNewMobileLead);
router.put('/leads/:id/kyc', verifyToken, mobileLeadController.submitLeadKYC);
router.post('/leads/:id/approve', verifyToken, mobileLeadController.processWorkflowApproval);