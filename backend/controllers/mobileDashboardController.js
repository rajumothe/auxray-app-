const { Lead, LeadExtension, Visit, TrackingLog, ServiceTicket, Employee } = require('../models');
const { Op } = require('sequelize');

exports.getRoleDashboardStats = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const userRole = req.user.role;

    // Time calculations: Identify start of today and start of current calendar month
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Initial default dashboard payload model structure
    let dashboardData = {
      role: userRole,
      trackingSession: null,
      metrics: {}
    };

    // 1. Fetch current active tracking session status (Universal for all field personnel)
    const activeSession = await TrackingLog.findOne({
      where: { employeeId, status: 'ACTIVE' },
      attributes: ['id', 'checkInTime', 'totalDistanceKm']
    });
    if (activeSession) dashboardData.trackingSession = activeSession;

    // --- SCOPE CONFIGURATION BY ROLE ---

    // TYPE A: EXECUTIVE DATA MATRIX
    if (userRole === 'Executive') {
      const leadsToday = await Lead.count({ where: { createdById: employeeId, createdAt: { [Op.gte]: startOfToday } } });
      const leadsMtd = await Lead.count({ where: { createdById: employeeId, createdAt: { [Op.gte]: startOfMonth } } });

      const visitsToday = await Visit.count({ where: { employeeId, createdAt: { [Op.gte]: startOfToday } } });
      const visitsMtd = await Visit.count({ where: { employeeId, createdAt: { [Op.gte]: startOfMonth } } });

      const conversionsToday = await Lead.count({ where: { createdById: employeeId, status: 'Approved', updatedAt: { [Op.gte]: startOfToday } } });
      const conversionsMtd = await Lead.count({ where: { createdById: employeeId, status: 'Approved', updatedAt: { [Op.gte]: startOfMonth } } });

      const leadTarget = 40;
      const leadVsActualPct = Number(((leadsMtd / leadTarget) * 100).toFixed(2));

      dashboardData.metrics = {
        leadsCreated: { today: leadsToday, mtd: leadsMtd },
        profilesVisited: { today: visitsToday, mtd: visitsMtd },
        customerConversions: { today: conversionsToday, mtd: conversionsMtd },
        targetVsAchievementPct: leadVsActualPct,
        leadTarget,
        leadActualMtd: leadsMtd,
        leadVsActualPct,
      };
    }

    // TYPE B: TECHNICIAN DATA MATRIX
    else if (userRole === 'Technician') {
      const assignedFresh = await ServiceTicket.count({ where: { technicianId: employeeId, status: 'FRESH' } });
      const assignedService = await ServiceTicket.count({ where: { technicianId: employeeId, status: 'ASSIGNED' } });
      
      // Pull open tickets matching Technician's service parameters (simulated fallback)
      const openInLocation = await ServiceTicket.count({ where: { status: 'FRESH' } });
      
      const resolvedToday = await ServiceTicket.count({ where: { technicianId: employeeId, status: 'RESOLVED', updatedAt: { [Op.gte]: startOfToday } } });

      dashboardData.metrics = {
        assignedTickets: { fresh: assignedFresh, activeService: assignedService },
        regionalPoolOpenTickets: openInLocation,
        resolvedToday: resolvedToday
      };
    }

    // TYPE C & D: ASM / RSM REGIONAL DATA AGGREGATIONS
    else if (['ASM', 'RSM', 'State Head', 'HOD'].includes(userRole)) {
      // Find all subordinate team member IDs to compile consolidated metrics hierarchies
      const team = await Employee.findAll({ where: { managerId: employeeId }, attributes: ['id'] });
      const teamIds = team.map(t => t.id);
      teamIds.push(employeeId); // Include manager's own operational actions

      const teamLeadsToday = await Lead.count({ where: { createdById: { [Op.in]: teamIds }, createdAt: { [Op.gte]: startOfToday } } });
      const teamLeadsMtd = await Lead.count({ where: { createdById: { [Op.in]: teamIds }, createdAt: { [Op.gte]: startOfMonth } } });

      const teamVisitsToday = await Visit.count({ where: { employeeId: { [Op.in]: teamIds }, createdAt: { [Op.gte]: startOfToday } } });
      const teamVisitsMtd = await Visit.count({ where: { employeeId: { [Op.in]: teamIds }, createdAt: { [Op.gte]: startOfMonth } } });

      const teamConversionsToday = await Lead.count({ where: { createdById: { [Op.in]: teamIds }, status: 'Approved', updatedAt: { [Op.gte]: startOfToday } } });
      const teamConversionsMtd = await Lead.count({ where: { createdById: { [Op.in]: teamIds }, status: 'Approved', updatedAt: { [Op.gte]: startOfMonth } } });

      const leadTarget = 160;
      const leadVsActualPct = Number(((teamLeadsMtd / leadTarget) * 100).toFixed(2));

      dashboardData.metrics = {
        teamLeadsCreated: { today: teamLeadsToday, mtd: teamLeadsMtd },
        teamVisitsCompleted: { today: teamVisitsToday, mtd: teamVisitsMtd },
        teamCustomerConversions: { today: teamConversionsToday, mtd: teamConversionsMtd },
        teamTargetVsAchievementPct: leadVsActualPct,
        leadTarget,
        leadActualMtd: teamLeadsMtd,
        leadVsActualPct,
      };
    }

    res.status(200).json({ success: true, data: dashboardData });
  } catch (error) {
    res.status(500).json({ message: 'Error calculating dashboard analytics parameters', error: error.message });
  }
};