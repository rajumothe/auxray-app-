const { ServiceTicket, Customer, Employee, EmployeeRoute } = require('../models');
const { Op } = require('sequelize');

const mapTicket = (ticket) => ({
  id: ticket.id,
  customerId: ticket.customerId,
  customerName: ticket.Customer?.customerName || null,
  customerContactNumber: ticket.Customer?.contactNumber || null,
  pinCode: ticket.pinCode,
  issueDescription: ticket.issueDescription,
  status: ticket.status,
  extendedDate: ticket.extendedDate,
  createdAt: ticket.createdAt,
  technicianName: ticket.Technician?.fullName || null,
  technicianEmpId: ticket.Technician?.empId || null,
});

exports.getCustomerOptions = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const routeMappings = await EmployeeRoute.findAll({
      where: { employeeId },
      attributes: ['routeId'],
      raw: true,
    });

    const routeIds = [...new Set(routeMappings.map((row) => row.routeId).filter(Boolean))];
    const where = { isActive: true };
    if (routeIds.length > 0) {
      where.routeId = { [Op.in]: routeIds };
    }

    const customers = await Customer.findAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: 100,
    });

    return res.status(200).json({
      data: customers.map((row) => ({
        id: row.id,
        customerName: row.customerName,
        contactNumber: row.contactNumber,
      })),
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching customer options', error: error.message });
  }
};

// 1. Create a fresh ticket (Raised by Customer Care or Executive)
exports.raiseServiceTicket = async (req, res) => {
  try {
    const raisedById = req.user.id;
    const { customerId, pinCode, issueDescription } = req.body;

    if (!customerId || !pinCode || !issueDescription) {
      return res.status(400).json({ message: 'Customer, pin code and issue description are required.' });
    }

    const customer = await Customer.findOne({ where: { id: customerId, isActive: true } });
    if (!customer) {
      return res.status(404).json({ message: 'Selected customer not found.' });
    }

    const ticket = await ServiceTicket.create({
      customerId,
      raisedById,
      pinCode,
      issueDescription,
      status: 'FRESH'
    });

    const persisted = await ServiceTicket.findByPk(ticket.id, {
      include: [{ model: Customer, attributes: ['customerName', 'contactNumber'], required: false }],
    });

    res.status(201).json({ message: 'Service ticket initialized in regional pool.', data: mapTicket(persisted) });
  } catch (error) {
    res.status(500).json({ message: 'Error creating support index entry', error: error.message });
  }
};

exports.getMyRaisedTickets = async (req, res) => {
  try {
    const tickets = await ServiceTicket.findAll({
      where: { raisedById: req.user.id },
      include: [
        { model: Customer, attributes: ['customerName', 'contactNumber'], required: false },
        { model: Employee, as: 'Technician', attributes: ['fullName', 'empId'], required: false },
      ],
      order: [['createdAt', 'DESC']],
      limit: 20,
    });

    return res.status(200).json({ data: tickets.map(mapTicket) });
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching raised ticket history', error: error.message });
  }
};

// 2. Fetch accessible unassigned tickets matching the technician's location parameters
exports.getAvailableTicketsPool = async (req, res) => {
  try {
    // Optional parameter to filter down to a specific postal zone
    const { filterPin } = req.query;
    
    let queryConditions = { status: 'FRESH', technicianId: null };
    if (filterPin) queryConditions.pinCode = filterPin;

    const ticketPool = await ServiceTicket.findAll({
      where: queryConditions,
      include: [{ model: Customer, attributes: ['customerName', 'contactNumber'], required: false }]
    });

    res.status(200).json({ data: ticketPool.map(mapTicket) });
  } catch (error) {
    res.status(500).json({ message: 'Error reading regional support desk matrix', error: error.message });
  }
};

// 3. Progress State Automation Engine (Handles travel, closure, photo metrics, and spare limitations)
exports.updateTicketProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const technicianId = req.user.id;
    const { nextStatus, photoProofUrl, digitalSignatureUrl, extendedDate, notes } = req.body;

    const ticket = await ServiceTicket.findByPk(id);
    if (!ticket) return res.status(404).json({ message: 'Support ticket not found.' });

    // Self-Assignment Catch
    if (nextStatus === 'ASSIGNED' && !ticket.technicianId) {
      await ServiceTicket.update({ technicianId, status: 'ASSIGNED' }, { where: { id } });
      return res.status(200).json({ message: 'Ticket assigned to your operational list successfully.' });
    }

    // Pipeline Enforcements
    if (nextStatus === 'RESOLVED') {
      if (!photoProofUrl || !digitalSignatureUrl) {
        return res.status(400).json({ message: 'Compliance violation: Resolution requires photo proof and customer signature.' });
      }
      await ServiceTicket.update({
        status: 'RESOLVED',
        photoProofUrl,
        digitalSignatureUrl
      }, { where: { id } });
      
      return res.status(200).json({ message: 'Ticket resolved. Validation metrics recorded successfully.' });
    }

    if (nextStatus === 'SPARE_DELAYED') {
      if (!extendedDate) {
        return res.status(400).json({ message: 'Rescheduling requires a valid next availability target date.' });
      }
      await ServiceTicket.update({
        status: 'SPARE_DELAYED',
        extendedDate,
        issueDescription: `${ticket.issueDescription} | Tech Note: [Awaiting Spares] ${notes || ''}`
      }, { where: { id } });

      return res.status(200).json({ message: 'Ticket extended due to component availability hold.' });
    }

    // Step-by-step progress tracking fallback updates ('TRAVELLING', 'STARTED')
    await ServiceTicket.update({ status: nextStatus }, { where: { id } });
    res.status(200).json({ message: `Ticket milestone status mutated to [${nextStatus}]` });

  } catch (error) {
    res.status(500).json({ message: 'Error processing technical lifecycle pipeline', error: error.message });
  }
};