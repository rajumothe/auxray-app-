const { Leave, Employee } = require('../models');

const LEAVE_TYPE_MAP = {
  CL: 'Casual Leave',
  SL: 'Sick Leave',
  PL: 'Privilege Leave',
  OD: 'On Duty',
  CO: 'Comp Off',
};

const getDateOnly = (value) => {
  if (!value || typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return null;
  }

  const parsed = new Date(`${normalized}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return normalized;
};

const mapLeave = (row) => ({
  id: row.id,
  leaveType: row.leaveType,
  leaveCode: Object.keys(LEAVE_TYPE_MAP).find((code) => LEAVE_TYPE_MAP[code] === row.leaveType) || null,
  fromDate: row.startDate,
  toDate: row.endDate,
  remarks: row.reason,
  status: row.status,
  createdAt: row.createdAt,
});

exports.getLeaveTypes = async (req, res) => {
  return res.status(200).json({
    data: Object.entries(LEAVE_TYPE_MAP).map(([code, label]) => ({ code, label })),
  });
};

exports.getMyLeaveRequests = async (req, res) => {
  try {
    const leaves = await Leave.findAll({
      where: { employeeId: req.user.id },
      order: [['createdAt', 'DESC']],
      limit: 20,
    });

    return res.status(200).json({ data: leaves.map(mapLeave) });
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching leave requests', error: error.message });
  }
};

exports.getLeaveApprovalQueue = async (req, res) => {
  try {
    const leaves = await Leave.findAll({
      where: { approvedById: req.user.id, status: 'Pending' },
      include: [{ model: Employee, required: true, attributes: ['fullName', 'empId'] }],
      order: [['createdAt', 'ASC']],
    });

    return res.status(200).json({
      data: leaves.map((row) => ({
        ...mapLeave(row),
        employeeName: row.Employee?.fullName || null,
        employeeEmpId: row.Employee?.empId || null,
      })),
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching leave approval queue', error: error.message });
  }
};

exports.applyLeaveRequest = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const { leaveCode, fromDate, toDate, remarks } = req.body || {};

    const resolvedLeaveType = LEAVE_TYPE_MAP[String(leaveCode || '').trim().toUpperCase()];
    const startDate = getDateOnly(fromDate);
    const endDate = getDateOnly(toDate);
    const normalizedRemarks = String(remarks || '').trim();

    if (!resolvedLeaveType) {
      return res.status(400).json({ message: 'Valid leave type is required.' });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Valid from and to dates are required in yyyy-mm-dd format.' });
    }

    if (startDate > endDate) {
      return res.status(400).json({ message: 'From date cannot be after to date.' });
    }

    if (!normalizedRemarks) {
      return res.status(400).json({ message: 'Remarks are required.' });
    }

    const employee = await Employee.findByPk(employeeId, { attributes: ['managerId'] });
    if (!employee?.managerId) {
      return res.status(400).json({ message: 'Reporting manager not mapped for this employee.' });
    }

    const leave = await Leave.create({
      employeeId,
      approvedById: employee.managerId,
      leaveType: resolvedLeaveType,
      startDate,
      endDate,
      reason: normalizedRemarks,
      status: 'Pending',
    });

    return res.status(201).json({
      message: 'Leave request submitted to reporting manager.',
      data: mapLeave(leave),
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error submitting leave request', error: error.message });
  }
};

exports.processLeaveApproval = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body || {};
    const normalizedAction = String(action || '').trim().toUpperCase();

    if (!['APPROVE', 'REJECT'].includes(normalizedAction)) {
      return res.status(400).json({ message: 'Valid leave workflow action is required.' });
    }

    const leave = await Leave.findOne({ where: { id, approvedById: req.user.id, status: 'Pending' } });
    if (!leave) {
      return res.status(404).json({ message: 'Pending leave request not found.' });
    }

    await leave.update({
      status: normalizedAction === 'APPROVE' ? 'Approved' : 'Rejected',
      approvedAt: new Date(),
    });

    return res.status(200).json({
      message: `Leave request ${normalizedAction === 'APPROVE' ? 'approved' : 'rejected'} successfully.`,
      data: mapLeave(leave),
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error processing leave approval', error: error.message });
  }
};