const { Op } = require('sequelize');
const { Customer, Route, SalesOffice, Plant, Lead, LeadExtension, Employee, EmployeeRoute, Attendance, Visit } = require('../models');

const hasFullAccess = (role) => {
  const normalizedRole = String(role || '').trim().toUpperCase();
  return ['HOD', 'BACK OFFICE', 'BACK END', 'BACKEND'].includes(normalizedRole);
};

const resolveHierarchyEmployeeScope = async (user) => {
  if (!user?.id) {
    return [];
  }

  if (hasFullAccess(user.role)) {
    return null; // null => unrestricted scope
  }

  const normalizedRole = String(user.role || '').trim().toUpperCase();
  const hierarchyRoles = ['STATE HEAD', 'SH', 'RSM', 'ASM'];

  if (!hierarchyRoles.includes(normalizedRole)) {
    return [user.id];
  }

  const scopedIds = new Set([user.id]);
  const queue = [user.id];

  while (queue.length > 0) {
    const managerId = queue.shift();
    const children = await Employee.findAll({
      where: { managerId, isActive: true },
      attributes: ['id'],
      raw: true,
    });

    for (const child of children) {
      if (!scopedIds.has(child.id)) {
        scopedIds.add(child.id);
        queue.push(child.id);
      }
    }
  }

  return Array.from(scopedIds);
};

const parseDateRange = (query) => {
  const { fromDate, toDate } = query;

  if (!fromDate && !toDate) {
    return null;
  }

  const start = fromDate ? new Date(`${fromDate}T00:00:00.000Z`) : new Date('1970-01-01T00:00:00.000Z');
  const end = toDate ? new Date(`${toDate}T23:59:59.999Z`) : new Date('2999-12-31T23:59:59.999Z');

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return { error: 'Invalid date range. Use yyyy-mm-dd format.' };
  }

  if (start > end) {
    return { error: 'Invalid date range. fromDate must be less than or equal to toDate.' };
  }

  return { start, end };
};

exports.getCustomerList = async (req, res) => {
  try {
    const range = parseDateRange(req.query);
    if (range?.error) {
      return res.status(400).json({ message: range.error });
    }

    const employeeScope = await resolveHierarchyEmployeeScope(req.user);

    const where = { isActive: true };
    if (range) {
      where.createdAt = { [Op.between]: [range.start, range.end] };
    }

    if (employeeScope && employeeScope.length === 0) {
      return res.status(200).json({ data: [] });
    }

    if (employeeScope) {
      const mappings = await EmployeeRoute.findAll({
        where: { employeeId: { [Op.in]: employeeScope } },
        attributes: ['routeId'],
        raw: true,
      });

      const routeIds = [...new Set(mappings.map((x) => x.routeId))];
      if (routeIds.length === 0) {
        return res.status(200).json({ data: [] });
      }
      where.routeId = { [Op.in]: routeIds };
    }

    const customers = await Customer.findAll({
      where,
      include: [
        {
          model: Route,
          required: false,
          attributes: ['routeCode', 'routeName'],
          include: [
            {
              model: SalesOffice,
              required: false,
              attributes: ['officeCode', 'officeName'],
              include: [{ model: Plant, required: false, attributes: ['plantCode', 'plantName'] }],
            },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    const data = customers.map((row) => ({
      id: row.id,
      customerName: row.customerName,
      contactNumber: row.contactNumber,
      routeCode: row.Route?.routeCode || null,
      routeName: row.Route?.routeName || null,
      officeCode: row.Route?.SalesOffice?.officeCode || null,
      officeName: row.Route?.SalesOffice?.officeName || null,
      plantCode: row.Route?.SalesOffice?.Plant?.plantCode || null,
      plantName: row.Route?.SalesOffice?.Plant?.plantName || null,
      createdAt: row.createdAt,
    }));

    return res.status(200).json({ data });
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching customer list', error: error.message });
  }
};

exports.getLeadList = async (req, res) => {
  try {
    const range = parseDateRange(req.query);
    if (range?.error) {
      return res.status(400).json({ message: range.error });
    }

    const employeeScope = await resolveHierarchyEmployeeScope(req.user);

    const where = { isActive: true };
    if (range) {
      where.createdAt = { [Op.between]: [range.start, range.end] };
    }

    if (employeeScope && employeeScope.length === 0) {
      return res.status(200).json({ data: [] });
    }
    if (employeeScope) {
      where.createdById = { [Op.in]: employeeScope };
    }

    const leads = await Lead.findAll({
      where,
      include: [
        {
          model: LeadExtension,
          required: false,
          attributes: ['stage', 'unitCapacitySelection'],
        },
        {
          model: Route,
          required: false,
          attributes: ['routeCode', 'routeName'],
        },
        {
          model: Employee,
          as: 'Creator',
          required: false,
          attributes: ['empId', 'fullName'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    const data = leads.map((row) => ({
      id: row.id,
      leadName: row.leadName,
      contactNumber: row.contactNumber,
      status: row.status,
      stage: row.LeadExtension?.stage || 'LEAD_CREATED',
      unitCapacitySelection: row.LeadExtension?.unitCapacitySelection || null,
      routeCode: row.Route?.routeCode || null,
      routeName: row.Route?.routeName || null,
      executiveEmpId: row.Creator?.empId || null,
      executiveName: row.Creator?.fullName || null,
      createdAt: row.createdAt,
    }));

    return res.status(200).json({ data });
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching lead list', error: error.message });
  }
};

exports.getAttendanceList = async (req, res) => {
  try {
    const range = parseDateRange(req.query);
    if (range?.error) {
      return res.status(400).json({ message: range.error });
    }

    const employeeScope = await resolveHierarchyEmployeeScope(req.user);

    const where = {};
    if (range) {
      where.date = {
        [Op.between]: [
          range.start.toISOString().slice(0, 10),
          range.end.toISOString().slice(0, 10),
        ],
      };
    }

    if (employeeScope && employeeScope.length === 0) {
      return res.status(200).json({ data: [] });
    }
    if (employeeScope) {
      where.employeeId = { [Op.in]: employeeScope };
    }

    const attendanceRows = await Attendance.findAll({
      where,
      include: [
        {
          model: Employee,
          required: true,
          attributes: ['empId', 'fullName', 'role', 'companyId'],
          where: { isActive: true },
        },
      ],
      order: [['date', 'DESC'], ['createdAt', 'DESC']],
    });

    const data = attendanceRows.map((row) => ({
      id: row.id,
      date: row.date,
      checkInTime: row.checkInTime,
      checkOutTime: row.checkOutTime,
      totalWorkHours: row.totalWorkHours,
      totalKmsTraveled: row.totalKmsTraveled,
      empId: row.Employee?.empId || null,
      employeeName: row.Employee?.fullName || null,
      role: row.Employee?.role || null,
    }));

    return res.status(200).json({ data });
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching attendance list', error: error.message });
  }
};

exports.getVisitList = async (req, res) => {
  try {
    const range = parseDateRange(req.query);
    if (range?.error) {
      return res.status(400).json({ message: range.error });
    }

    const employeeScope = await resolveHierarchyEmployeeScope(req.user);

    const where = {};
    if (range) {
      where.visitDate = {
        [Op.between]: [
          range.start.toISOString().slice(0, 10),
          range.end.toISOString().slice(0, 10),
        ],
      };
    }

    if (employeeScope && employeeScope.length === 0) {
      return res.status(200).json({ data: [] });
    }
    if (employeeScope) {
      where.employeeId = { [Op.in]: employeeScope };
    }

    const visits = await Visit.findAll({
      where,
      include: [
        {
          model: Employee,
          required: false,
          attributes: ['empId', 'fullName', 'role'],
        },
        {
          model: Lead,
          required: false,
          attributes: ['leadName', 'contactNumber'],
        },
        {
          model: Customer,
          required: false,
          attributes: ['customerName', 'contactNumber'],
        },
      ],
      order: [['visitDate', 'DESC'], ['createdAt', 'DESC']],
    });

    const data = visits.map((row) => ({
      id: row.id,
      visitDate: row.visitDate,
      purpose: row.purpose,
      remarks: row.remarks,
      checkInTime: row.checkInTime,
      checkOutTime: row.checkOutTime,
      empId: row.Employee?.empId || null,
      employeeName: row.Employee?.fullName || null,
      role: row.Employee?.role || null,
      leadName: row.Lead?.leadName || null,
      leadContactNumber: row.Lead?.contactNumber || null,
      customerName: row.Customer?.customerName || null,
      customerContactNumber: row.Customer?.contactNumber || null,
    }));

    return res.status(200).json({ data });
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching visit list', error: error.message });
  }
};
