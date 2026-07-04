const { Op } = require('sequelize');
const { Visit, Lead, Customer, EmployeeRoute, Route } = require('../models');

const MINIMUM_VISIT_DURATION_MS = 60 * 1000;

const formatTarget = (row, type) => ({
  id: row.id,
  type,
  name: type === 'LEAD' ? row.leadName : row.customerName,
  contactNumber: row.contactNumber || null,
  address: row.address || null,
  routeName: row.Route?.routeName || null,
  routeCode: row.Route?.routeCode || null,
  latitude: row.latitude ?? null,
  longitude: row.longitude ?? null,
});

const mapVisit = (row) => {
  const targetType = row.leadId ? 'LEAD' : 'CUSTOMER';
  const targetName = row.Lead?.leadName || row.Customer?.customerName || 'Unknown Target';
  const targetContactNumber = row.Lead?.contactNumber || row.Customer?.contactNumber || null;
  const targetAddress = row.Lead?.address || null;
  const durationMs = row.checkOutTime
    ? new Date(row.checkOutTime).getTime() - new Date(row.checkInTime).getTime()
    : Date.now() - new Date(row.checkInTime).getTime();

  return {
    id: row.id,
    visitDate: row.visitDate,
    purpose: row.purpose || '',
    remarks: row.remarks || '',
    checkInTime: row.checkInTime,
    checkOutTime: row.checkOutTime,
    visitLat: row.visitLat,
    visitLng: row.visitLng,
    targetId: row.leadId || row.customerId,
    targetType,
    targetName,
    targetContactNumber,
    targetAddress,
    minimumDurationSeconds: Math.floor(MINIMUM_VISIT_DURATION_MS / 1000),
    elapsedSeconds: Math.max(0, Math.floor(durationMs / 1000)),
    canSubmit: durationMs >= MINIMUM_VISIT_DURATION_MS,
    status: row.checkOutTime ? 'COMPLETED' : 'ACTIVE',
  };
};

const getAssignedRouteIds = async (employeeId) => {
  const mappings = await EmployeeRoute.findAll({
    where: { employeeId },
    attributes: ['routeId'],
    raw: true,
  });

  return [...new Set(mappings.map((entry) => entry.routeId).filter(Boolean))];
};

exports.getVisitTargets = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const routeIds = await getAssignedRouteIds(employeeId);

    const leadWhere = { isActive: true };
    const customerWhere = { isActive: true };

    if (routeIds.length > 0) {
      leadWhere[Op.or] = [
        { createdById: employeeId },
        { routeId: { [Op.in]: routeIds } },
      ];
      customerWhere.routeId = { [Op.in]: routeIds };
    } else {
      leadWhere.createdById = employeeId;
    }

    const [leads, customers] = await Promise.all([
      Lead.findAll({
        where: leadWhere,
        include: [{ model: Route, required: false, attributes: ['routeName', 'routeCode'] }],
        order: [['createdAt', 'DESC']],
        limit: 100,
      }),
      Customer.findAll({
        where: customerWhere,
        include: [{ model: Route, required: false, attributes: ['routeName', 'routeCode'] }],
        order: [['createdAt', 'DESC']],
        limit: 100,
      }),
    ]);

    const mergedTargets = [
      ...leads.map((row) => formatTarget(row, 'LEAD')),
      ...customers.map((row) => formatTarget(row, 'CUSTOMER')),
    ].sort((left, right) => String(left.name || '').localeCompare(String(right.name || '')));

    return res.status(200).json({
      data: {
        targets: mergedTargets,
        leads: leads.map((row) => formatTarget(row, 'LEAD')),
        customers: customers.map((row) => formatTarget(row, 'CUSTOMER')),
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching visit targets', error: error.message });
  }
};

exports.getVisitHistory = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const visits = await Visit.findAll({
      where: { employeeId },
      include: [
        { model: Lead, required: false, attributes: ['leadName', 'contactNumber', 'address'] },
        { model: Customer, required: false, attributes: ['customerName', 'contactNumber'] },
      ],
      order: [['visitDate', 'DESC'], ['createdAt', 'DESC']],
      limit: 20,
    });

    return res.status(200).json({ data: visits.map(mapVisit) });
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching visit history', error: error.message });
  }
};

exports.getActiveVisit = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const activeVisit = await Visit.findOne({
      where: { employeeId, checkOutTime: null },
      include: [
        { model: Lead, required: false, attributes: ['leadName', 'contactNumber', 'address'] },
        { model: Customer, required: false, attributes: ['customerName', 'contactNumber'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    return res.status(200).json({ data: activeVisit ? mapVisit(activeVisit) : null });
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching active visit', error: error.message });
  }
};

exports.startVisit = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const { targetId, targetType, purpose, remarks, latitude, longitude } = req.body || {};

    if (!targetId || !targetType || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ message: 'Target, type, latitude and longitude are required.' });
    }

    const normalizedType = String(targetType).trim().toUpperCase();
    if (!['LEAD', 'CUSTOMER'].includes(normalizedType)) {
      return res.status(400).json({ message: 'Invalid target type.' });
    }

    const activeVisit = await Visit.findOne({ where: { employeeId, checkOutTime: null } });
    if (activeVisit) {
      return res.status(400).json({ message: 'You already have an active visit. Complete it before starting a new one.' });
    }

    let leadId = null;
    let customerId = null;
    let targetRecord = null;

    if (normalizedType === 'LEAD') {
      targetRecord = await Lead.findOne({ where: { id: targetId, isActive: true, createdById: employeeId } });
      leadId = targetRecord?.id || null;
    } else {
      const routeIds = await getAssignedRouteIds(employeeId);
      const customerWhere = { id: targetId, isActive: true };
      if (routeIds.length > 0) {
        customerWhere.routeId = { [Op.in]: routeIds };
      }
      targetRecord = await Customer.findOne({ where: customerWhere });
      customerId = targetRecord?.id || null;
    }

    if (!targetRecord) {
      return res.status(404).json({ message: 'Selected visit target not found.' });
    }

    const visit = await Visit.create({
      employeeId,
      leadId,
      customerId,
      visitDate: new Date().toISOString().slice(0, 10),
      checkInTime: new Date(),
      checkOutTime: null,
      visitLat: Number(latitude),
      visitLng: Number(longitude),
      purpose: purpose ? String(purpose).trim() : '',
      remarks: remarks ? String(remarks).trim() : '',
    });

    const persisted = await Visit.findByPk(visit.id, {
      include: [
        { model: Lead, required: false, attributes: ['leadName', 'contactNumber', 'address'] },
        { model: Customer, required: false, attributes: ['customerName', 'contactNumber'] },
      ],
    });

    return res.status(201).json({
      message: 'Visit started successfully.',
      data: mapVisit(persisted),
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error starting visit', error: error.message });
  }
};

exports.completeVisit = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const { id } = req.params;
    const { purpose, remarks } = req.body || {};

    if (!purpose || !String(purpose).trim() || !remarks || !String(remarks).trim()) {
      return res.status(400).json({ message: 'Visit purpose and discussion points are required before submitting.' });
    }

    const visit = await Visit.findOne({
      where: { id, employeeId, checkOutTime: null },
      include: [
        { model: Lead, required: false, attributes: ['leadName', 'contactNumber', 'address'] },
        { model: Customer, required: false, attributes: ['customerName', 'contactNumber'] },
      ],
    });

    if (!visit) {
      return res.status(404).json({ message: 'Active visit not found.' });
    }

    const completedAt = new Date();
    const elapsedMs = completedAt.getTime() - new Date(visit.checkInTime).getTime();
    if (elapsedMs < MINIMUM_VISIT_DURATION_MS) {
      const remainingSeconds = Math.ceil((MINIMUM_VISIT_DURATION_MS - elapsedMs) / 1000);
      return res.status(400).json({ message: `Visit can be submitted after ${remainingSeconds} more seconds.` });
    }

    await visit.update({
      checkOutTime: completedAt,
      purpose: String(purpose).trim(),
      remarks: String(remarks).trim(),
    });

    return res.status(200).json({
      message: 'Visit submitted successfully.',
      data: mapVisit(visit),
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error completing visit', error: error.message });
  }
};