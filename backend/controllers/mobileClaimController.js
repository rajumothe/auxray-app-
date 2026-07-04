const { Op } = require('sequelize');
const { ExpenseClaim, TrackingLog, Employee } = require('../models');

const getStartOfMonth = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
};

const numberOrZero = (value) => Number.parseFloat(value || 0) || 0;

const mapClaim = (row) => ({
  id: row.id,
  claimType: row.claimType,
  distanceKm: numberOrZero(row.distanceKm),
  taAmount: numberOrZero(row.taAmount),
  daAmount: numberOrZero(row.daAmount),
  ancillaryAmount: numberOrZero(row.ancillaryAmount),
  totalAmount: numberOrZero(row.totalAmount),
  description: row.description,
  billAttached: Boolean(row.billAttached),
  status: row.status,
  approvedAt: row.approvedAt,
  createdAt: row.createdAt,
  employeeName: row.Employee?.fullName || null,
  employeeEmpId: row.Employee?.empId || null,
});

const getManagerId = async (employeeId) => {
  const employee = await Employee.findByPk(employeeId, { attributes: ['id', 'managerId'] });
  return employee?.managerId || null;
};

const getMonthlyTrackingSummary = async (employeeId) => {
  const trackingRows = await TrackingLog.findAll({
    where: {
      employeeId,
      status: 'COMPLETED',
      checkOutTime: { [Op.gte]: getStartOfMonth() },
    },
    order: [['checkOutTime', 'DESC']],
  });

  return trackingRows.reduce((accumulator, row) => ({
    accumulatedDistanceKm: accumulator.accumulatedDistanceKm + numberOrZero(row.totalDistanceKm),
    computedTaAmount: accumulator.computedTaAmount + numberOrZero(row.taAmount),
    computedDaAmount: accumulator.computedDaAmount + numberOrZero(row.daAmount),
  }), {
    accumulatedDistanceKm: 0,
    computedTaAmount: 0,
    computedDaAmount: 0,
  });
};

exports.getMyClaimSummary = async (req, res) => {
  try {
    const summary = await getMonthlyTrackingSummary(req.user.id);
    const totalPayoutInr = summary.computedTaAmount + summary.computedDaAmount;

    return res.status(200).json({
      data: {
        accumulatedDistanceKm: summary.accumulatedDistanceKm.toFixed(2),
        computedTaAmount: summary.computedTaAmount.toFixed(2),
        computedDaAmount: summary.computedDaAmount.toFixed(2),
        totalPayoutInr: totalPayoutInr.toFixed(2),
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching claim summary', error: error.message });
  }
};

exports.getMyClaims = async (req, res) => {
  try {
    const claims = await ExpenseClaim.findAll({
      where: { employeeId: req.user.id },
      order: [['createdAt', 'DESC']],
      limit: 20,
    });

    return res.status(200).json({ data: claims.map(mapClaim) });
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching claims', error: error.message });
  }
};

exports.submitClaim = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const { description, amount, billAttached } = req.body || {};

    if (!description || !String(description).trim()) {
      return res.status(400).json({ message: 'Claim description is required.' });
    }

    const ancillaryAmount = numberOrZero(amount);
    if (ancillaryAmount <= 0) {
      return res.status(400).json({ message: 'Claim amount must be greater than zero.' });
    }

    if (!billAttached) {
      return res.status(400).json({ message: 'Bill attachment confirmation is required.' });
    }

    const managerId = await getManagerId(employeeId);
    if (!managerId) {
      return res.status(400).json({ message: 'Reporting manager not mapped for this employee.' });
    }

    const summary = await getMonthlyTrackingSummary(employeeId);
    const totalAmount = summary.computedTaAmount + summary.computedDaAmount + ancillaryAmount;

    const claim = await ExpenseClaim.create({
      employeeId,
      approvedById: managerId,
      claimType: 'TA_DA_ANCILLARY',
      distanceKm: summary.accumulatedDistanceKm,
      taAmount: summary.computedTaAmount,
      daAmount: summary.computedDaAmount,
      ancillaryAmount,
      totalAmount,
      description: String(description).trim(),
      billAttached: true,
      status: 'Pending',
    });

    return res.status(201).json({ message: 'Claim submitted to reporting manager.', data: mapClaim(claim) });
  } catch (error) {
    return res.status(500).json({ message: 'Error submitting claim', error: error.message });
  }
};

exports.getClaimApprovalQueue = async (req, res) => {
  try {
    const claims = await ExpenseClaim.findAll({
      where: { approvedById: req.user.id, status: 'Pending' },
      include: [{ model: Employee, required: true, attributes: ['fullName', 'empId'] }],
      order: [['createdAt', 'ASC']],
    });

    return res.status(200).json({ data: claims.map(mapClaim) });
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching claim approval queue', error: error.message });
  }
};

exports.processClaimApproval = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body || {};
    const normalizedAction = String(action || '').trim().toUpperCase();

    if (!['APPROVE', 'REJECT'].includes(normalizedAction)) {
      return res.status(400).json({ message: 'Valid claim workflow action is required.' });
    }

    const claim = await ExpenseClaim.findOne({ where: { id, approvedById: req.user.id, status: 'Pending' } });
    if (!claim) {
      return res.status(404).json({ message: 'Pending claim request not found.' });
    }

    await claim.update({
      status: normalizedAction === 'APPROVE' ? 'Approved' : 'Rejected',
      approvedAt: new Date(),
    });

    return res.status(200).json({
      message: `Claim ${normalizedAction === 'APPROVE' ? 'approved' : 'rejected'} successfully.`,
      data: mapClaim(claim),
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error processing claim approval', error: error.message });
  }
};