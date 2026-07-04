const express = require('express');
const router = express.Router();
const trackingController = require('../controllers/trackingController');
const { verifyToken } = require('../middlewares/authMiddleware');
const mobileDashboardController = require('../controllers/mobileDashboardController');
const serviceTicketController = require('../controllers/serviceTicketController');
const mobileLeadController = require('../controllers/mobileLeadController');
const mobileVisitController = require('../controllers/mobileVisitController');
const mobileLeaveController = require('../controllers/mobileLeaveController');
const mobileClaimController = require('../controllers/mobileClaimController');
const mobileProfileController = require('../controllers/mobileProfileController');

// Standardized Token Enforcement across all mobile endpoints
router.post('/check-in', verifyToken, trackingController.checkIn);
router.post('/gps-batch', verifyToken, trackingController.syncGpsBatch);
router.post('/check-out', verifyToken, trackingController.checkOut);

// Dashboard Real-Time Compilation Engine
router.get('/dashboard/stats', verifyToken, mobileDashboardController.getRoleDashboardStats);

// Profile flow (mobile)
router.get('/profile', verifyToken, mobileProfileController.getMyProfile);
router.patch('/profile/password', verifyToken, mobileProfileController.updateMyPassword);

// Lead capture flow (mobile)
router.get('/unit-capacity-options', verifyToken, mobileLeadController.getUnitCapacityOptions);
router.get('/leads', verifyToken, mobileLeadController.getMyMobileLeads);
router.get('/leads/approval-queue', verifyToken, mobileLeadController.getApprovalQueue);
router.get('/technicians', verifyToken, mobileLeadController.getTechnicianOptions);
router.post('/leads', verifyToken, mobileLeadController.createNewMobileLead);
router.post('/leads/:id/kyc', verifyToken, mobileLeadController.uploadKycDocs, mobileLeadController.submitLeadKYC);
router.patch('/leads/:id/workflow', verifyToken, mobileLeadController.processWorkflowApproval);

// Visit capture flow (mobile)
router.get('/visit-targets', verifyToken, mobileVisitController.getVisitTargets);
router.get('/visits', verifyToken, mobileVisitController.getVisitHistory);
router.get('/visits/active', verifyToken, mobileVisitController.getActiveVisit);
router.post('/visits/start', verifyToken, mobileVisitController.startVisit);
router.patch('/visits/:id/complete', verifyToken, mobileVisitController.completeVisit);

// Leave and OD flow (mobile)
router.get('/leave-types', verifyToken, mobileLeaveController.getLeaveTypes);
router.get('/leaves', verifyToken, mobileLeaveController.getMyLeaveRequests);
router.post('/leaves', verifyToken, mobileLeaveController.applyLeaveRequest);
router.get('/leaves/approval-queue', verifyToken, mobileLeaveController.getLeaveApprovalQueue);
router.patch('/leaves/:id/workflow', verifyToken, mobileLeaveController.processLeaveApproval);

// Claims workflow (mobile)
router.get('/claims/summary', verifyToken, mobileClaimController.getMyClaimSummary);
router.get('/claims', verifyToken, mobileClaimController.getMyClaims);
router.post('/claims', verifyToken, mobileClaimController.submitClaim);
router.get('/claims/approval-queue', verifyToken, mobileClaimController.getClaimApprovalQueue);
router.patch('/claims/:id/workflow', verifyToken, mobileClaimController.processClaimApproval);

// Technician Support & Lifecycle Operational Tracks
router.get('/tickets/customers', verifyToken, serviceTicketController.getCustomerOptions);
router.get('/tickets/mine', verifyToken, serviceTicketController.getMyRaisedTickets);
router.post('/tickets', verifyToken, serviceTicketController.raiseServiceTicket);
router.get('/tickets/pool', verifyToken, serviceTicketController.getAvailableTicketsPool);
router.patch('/tickets/:id/status', verifyToken, serviceTicketController.updateTicketProgress);

module.exports = router;

