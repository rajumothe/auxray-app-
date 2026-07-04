const { Lead, LeadExtension, SKU, Route, EmployeeRoute, MaterialType, Employee } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '..', 'uploads', 'kyc');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

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

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const safeExt = path.extname(file.originalname || '').toLowerCase() || '.bin';
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`);
  },
});

exports.uploadKycDocs = multer({ storage }).fields([
  { name: 'panDoc', maxCount: 1 },
  { name: 'aadhaarDoc', maxCount: 1 },
  { name: 'ebBillDoc', maxCount: 1 },
  { name: 'bankDoc', maxCount: 1 },
  { name: 'ebLetterDoc', maxCount: 1 },
]);

// 1. PHASE 1: Capture standard field lead variables
exports.createNewMobileLead = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const createdById = req.user.id; // From verifyToken middleware
    const { customerName, contactNo, address, pinCode, routeId, unitCapacitySelection, latitude, longitude } = req.body;

    if (!customerName || !contactNo || !address || !unitCapacitySelection) {
      await t.rollback();
      return res.status(400).json({ message: 'Customer name, contact number, address and unit capacity are required.' });
    }

    // Route is optional from app payload; fallback to first mapped route for this employee.
    let resolvedRouteId = routeId || null;
    if (!resolvedRouteId) {
      const assignment = await EmployeeRoute.findOne({ where: { employeeId: createdById } });
      resolvedRouteId = assignment?.routeId || null;
    }

    // Final safety fallback for environments where route mapping is not done yet.
    if (!resolvedRouteId) {
      const fallbackRoute = await Route.findOne({ where: { isActive: true }, order: [['createdAt', 'ASC']] });
      resolvedRouteId = fallbackRoute?.id || null;
    }

    // Validate mandatory route parameters
    const targetRoute = resolvedRouteId ? await Route.findByPk(resolvedRouteId) : null;
    if (!targetRoute) {
      await t.rollback();
      return res.status(404).json({ message: 'No route mapped for this employee. Please assign route first.' });
    }

    // Create Base Lead Row
    const baseLead = await Lead.create({
      leadName: customerName,
      contactNumber: contactNo,
      address,
      pinCode: pinCode || null,
      latitude: latitude ?? 0,
      longitude: longitude ?? 0,
      routeId: resolvedRouteId,
      createdById,
      status: 'Pending KYC Submission'
    }, { transaction: t });

    // Initialize Extended KYC Tracker Metadata block
    await LeadExtension.create({
      leadId: baseLead.id,
      unitCapacitySelection, // e.g., '5KW Mono', '10KW Bifacial'
      stage: 'LEAD_CREATED'
    }, { transaction: t });

    await t.commit();
    res.status(201).json({ message: 'Lead captured successfully in system ledger.', leadId: baseLead.id });
  } catch (error) {
    await t.rollback();
    res.status(500).json({ message: 'Error initializing field lead profile', error: error.message });
  }
};

// 2. PHASE 2: Upload digital KYC artifacts (Executed by Executive)
exports.submitLeadKYC = async (req, res) => {
  try {
    const { id } = req.params; // leadId
    const {
      panCardNumber,
      aadhaarNumber,
      ebBillNumber,
      bankDetails,
      ebLetterNumber,
    } = req.body;

    const files = req.files || {};
    const panDoc = files.panDoc?.[0];
    const aadhaarDoc = files.aadhaarDoc?.[0];
    const ebBillDoc = files.ebBillDoc?.[0];
    const bankDoc = files.bankDoc?.[0];
    const ebLetterDoc = files.ebLetterDoc?.[0];

    if (!panCardNumber || !aadhaarNumber || !ebBillNumber || !bankDetails || !ebLetterNumber) {
      return res.status(400).json({
        message: 'PAN No, Aadhaar No, EB Bill No, Bank Details and EB Letter Number are required.',
      });
    }

    if (!panDoc || !aadhaarDoc || !ebBillDoc || !bankDoc || !ebLetterDoc) {
      return res.status(400).json({
        message: 'All required KYC documents must be uploaded.',
      });
    }

    const extension = await LeadExtension.findOne({ where: { leadId: id } });
    if (!extension) {
      return res.status(404).json({ message: 'Lead extension record framework not found.' });
    }

    const adhaarLast4 = aadhaarNumber.slice(-4);
    const aadhaarMask = adhaarLast4 ? `XXXX-XXXX-${adhaarLast4}` : null;

    await LeadExtension.update({
      panCardNumber,
      aadhaarNumber,
      aadhaarMaskedReference: aadhaarMask,
      ebBillNumber,
      bankDetails,
      ebLetterNumber,
      panCardDocUrl: `/uploads/kyc/${panDoc.filename}`,
      aadhaarDocUrl: `/uploads/kyc/${aadhaarDoc.filename}`,
      ebBillUrl: `/uploads/kyc/${ebBillDoc.filename}`,
      bankStatementUrl: `/uploads/kyc/${bankDoc.filename}`,
      ebApprovalDocUrl: `/uploads/kyc/${ebLetterDoc.filename}`,
      stage: 'KYC_SUBMITTED'
    }, { where: { leadId: id } });

    await Lead.update({ status: 'Pending ASM Approval' }, { where: { id } });

    res.status(200).json({ message: 'KYC documentation uploaded successfully. Pending verification.' });
  } catch (error) {
    res.status(500).json({ message: 'Error attaching compliance parameters', error: error.message });
  }
};

// 3. PHASE 3: Dynamic State Verification Engine (ASM and Back Office Pipeline)
exports.processWorkflowApproval = async (req, res) => {
  try {
    const { id } = req.params; // leadId
    const { action, loanApprovalReference, technicianId, orderReference, paymentReference } = req.body;
    const reviewerId = req.user.id;
    const reviewerRole = req.user.role; // Enforced via your token check layers

    const extension = await LeadExtension.findOne({ where: { leadId: id } });
    if (!extension) return res.status(404).json({ message: 'Lead tracking profile missing.' });

    if (action === 'ASM_APPROVE') {
      if (!['ASM', 'RSM', 'HOD'].includes(reviewerRole)) {
        return res.status(403).json({ message: 'Access denied. Only Area Sales Managers can authorize this level.' });
      }
      await LeadExtension.update({
        stage: 'ASM_APPROVED',
        asmApprovedBy: reviewerId
      }, { where: { leadId: id } });

      await Lead.update({ status: 'Pending Back Office Review' }, { where: { id } });
      
      return res.status(200).json({ message: 'Area Sales Manager verification recorded.' });
    }

    if (action === 'ASM_REJECT') {
      if (!['ASM', 'RSM', 'HOD'].includes(reviewerRole)) {
        return res.status(403).json({ message: 'Access denied. Only ASM/RSM/HOD can reject this lead.' });
      }
      await Lead.update({ status: 'Rejected by ASM', isActive: false }, { where: { id } });
      return res.status(200).json({ message: 'Lead rejected by ASM workflow.' });
    }

    if (action === 'SEND_TO_BACK_OFFICE') {
      if (!['ASM', 'RSM', 'HOD'].includes(reviewerRole)) {
        return res.status(403).json({ message: 'Only ASM/RSM/HOD can forward case to back office.' });
      }
      await LeadExtension.update({ stage: 'PENDING_BACK_OFFICE_REVIEW' }, { where: { leadId: id } });
      await Lead.update({ status: 'Pending Back Office Review' }, { where: { id } });
      return res.status(200).json({ message: 'Lead moved to Back Office review queue.' });
    }

    if (action === 'BACK_OFFICE_APPROVE') {
      if (!['BACK OFFICE', 'HOD', 'ADMIN'].includes(String(reviewerRole || '').toUpperCase())) {
        return res.status(403).json({ message: 'Only back office authorized roles can approve this stage.' });
      }
      await LeadExtension.update({
        stage: 'BACK_OFFICE_APPROVED',
        backOfficeApprovedBy: reviewerId,
      }, { where: { leadId: id } });
      await Lead.update({ status: 'Back Office Approved' }, { where: { id } });
      return res.status(200).json({ message: 'Back Office approved the lead.' });
    }

    if (action === 'CREATE_CUSTOMER') {
      await LeadExtension.update({ stage: 'CUSTOMER_CREATED' }, { where: { leadId: id } });
      await Lead.update({ status: 'Customer Created' }, { where: { id } });
      return res.status(200).json({ message: 'Customer record created from lead.' });
    }

    if (action === 'INITIATE_LOAN') {
      await LeadExtension.update({
        stage: 'LOAN_INITIATED',
        loanApprovalReference: loanApprovalReference || null,
      }, { where: { leadId: id } });
      await Lead.update({ status: 'Bank Loan / Payment Initiated' }, { where: { id } });
      return res.status(200).json({ message: 'Bank loan/payment initiation marked successfully.' });
    }

    if (action === 'PAYMENT_COMPLETED') {
      await LeadExtension.update({
        stage: 'PAYMENT_COMPLETED',
        paymentReference: paymentReference || null,
      }, { where: { leadId: id } });
      await Lead.update({ status: 'Payment Completed' }, { where: { id } });
      return res.status(200).json({ message: 'Payment completion marked.' });
    }

    if (action === 'ORDER_CONFIRMED') {
      await LeadExtension.update({
        stage: 'ORDER_CONFIRMED',
        orderReference: orderReference || null,
      }, { where: { leadId: id } });
      await Lead.update({ status: 'Order Confirmed' }, { where: { id } });
      return res.status(200).json({ message: 'Order marked as confirmed.' });
    }

    if (action === 'MATERIAL_DISPATCHED') {
      await LeadExtension.update({ stage: 'MATERIAL_DISPATCHED' }, { where: { leadId: id } });
      await Lead.update({ status: 'Material Dispatched' }, { where: { id } });
      return res.status(200).json({ message: 'Material dispatch marked.' });
    }

    if (action === 'MATERIAL_DELIVERED') {
      await LeadExtension.update({ stage: 'MATERIAL_DELIVERED' }, { where: { leadId: id } });
      await Lead.update({ status: 'Material Delivered' }, { where: { id } });
      return res.status(200).json({ message: 'Material delivery marked.' });
    }

    if (action === 'ASSIGN_TECHNICIAN') {
      const lead = await Lead.findByPk(id);
      if (!lead) {
        return res.status(404).json({ message: 'Lead not found.' });
      }

      let resolvedTechnicianId = technicianId || null;

      // Auto-assign route technician first when technicianId not supplied.
      if (!resolvedTechnicianId && lead.routeId) {
        const routeMappings = await EmployeeRoute.findAll({
          where: { routeId: lead.routeId },
          attributes: ['employeeId'],
        });

        const mappedIds = routeMappings.map((m) => m.employeeId);
        if (mappedIds.length > 0) {
          const routeTechnician = await Employee.findOne({
            where: { id: { [Op.in]: mappedIds }, role: 'Technician', isActive: true },
            order: [['createdAt', 'ASC']],
          });
          resolvedTechnicianId = routeTechnician?.id || null;
        }
      }

      // Manual fallback must provide a valid technician when route technician is unavailable.
      if (!resolvedTechnicianId) {
        return res.status(400).json({
          message: 'No technician mapped on this route. Please select another technician manually.',
        });
      }

      const technician = await Employee.findOne({
        where: { id: resolvedTechnicianId, role: 'Technician', isActive: true },
      });

      if (!technician) {
        return res.status(400).json({ message: 'Selected technician is invalid or inactive.' });
      }

      await LeadExtension.update({
        stage: 'TECHNICIAN_ASSIGNED',
        assignedTechnicianId: resolvedTechnicianId,
      }, { where: { leadId: id } });
      await Lead.update({ status: 'Technician Assigned' }, { where: { id } });
      return res.status(200).json({
        message: 'Technician assignment marked.',
        technician: { id: technician.id, fullName: technician.fullName, empId: technician.empId },
      });
    }

    if (action === 'TECHNICIAN_VISITED') {
      await LeadExtension.update({ stage: 'TECHNICIAN_VISITED' }, { where: { leadId: id } });
      await Lead.update({ status: 'Technician Visited' }, { where: { id } });
      return res.status(200).json({ message: 'Technician visit marked.' });
    }

    if (action === 'INSTALLATION_START') {
      await LeadExtension.update({ stage: 'INSTALLATION_IN_PROGRESS' }, { where: { leadId: id } });
      await Lead.update({ status: 'Installation In Progress' }, { where: { id } });
      return res.status(200).json({ message: 'Installation start marked.' });
    }

    if (action === 'INSTALLATION_COMPLETE') {
      await LeadExtension.update({ stage: 'INSTALLATION_COMPLETED' }, { where: { leadId: id } });
      await Lead.update({ status: 'Installation Completed - Process Closed' }, { where: { id } });
      return res.status(200).json({ message: 'Installation completed and closed.' });
    }

    if (action === 'BO_FINAL_CONVERT') {
      if (extension.stage !== 'ASM_APPROVED' && reviewerRole !== 'HOD') {
        return res.status(400).json({ message: 'Cannot process final registration without antecedent ASM validation.' });
      }
      
      await LeadExtension.update({
        stage: 'CUSTOMER_CONVERTED',
        backOfficeApprovedBy: reviewerId,
        loanApprovalReference: loanApprovalReference || 'DIRECT_DEBIT'
      }, { where: { leadId: id } });

      // Update parent lookup index state
      await Lead.update({ status: 'CONVERTED' }, { where: { id } });

      return res.status(200).json({ message: 'Loan processed. Lead successfully converted to full Customer account status.' });
    }

    res.status(400).json({ message: 'Invalid pipeline workflow action requested.' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating workflow routing parameters', error: error.message });
  }
};

// 1B. UNIT CAPACITY OPTIONS (SKU MASTER)
exports.getUnitCapacityOptions = async (req, res) => {
  try {
    const skus = await SKU.findAll({
      where: { isActive: true },
      include: [{ model: MaterialType, attributes: ['shortCode', 'description'] }],
      order: [['itemName', 'ASC']],
    });

    const options = skus.map((sku) => ({
      id: sku.id,
      value: sku.itemName,
      label: sku.MaterialType?.shortCode ? `${sku.itemName} (${sku.MaterialType.shortCode})` : sku.itemName,
      uom: sku.uom,
    }));

    res.status(200).json({ data: options });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching unit capacity options', error: error.message });
  }
};

// 1C. FETCH MOBILE LEADS LIST (CURRENT USER)
exports.getMyMobileLeads = async (req, res) => {
  try {
    const employeeScope = await resolveHierarchyEmployeeScope(req.user);
    const where = { isActive: true };

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
          attributes: ['stage', 'unitCapacitySelection'],
          required: false,
        },
        {
          model: Route,
          attributes: ['routeName', 'routeCode'],
          required: false,
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    const data = leads.map((lead) => ({
      id: lead.id,
      leadName: lead.leadName,
      contactNumber: lead.contactNumber,
      address: lead.address,
      pinCode: lead.pinCode,
      latitude: lead.latitude,
      longitude: lead.longitude,
      routeId: lead.routeId,
      status: lead.status,
      stage: lead.LeadExtension?.stage || 'LEAD_CREATED',
      unitCapacitySelection: lead.LeadExtension?.unitCapacitySelection || '',
      routeName: lead.Route?.routeName || null,
      routeCode: lead.Route?.routeCode || null,
      createdAt: lead.createdAt,
    }));

    return res.status(200).json({ data });
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching mobile leads list', error: error.message });
  }
};

// 1D. FETCH APPROVAL QUEUE (ROLE-AWARE)
exports.getApprovalQueue = async (req, res) => {
  try {
    const reviewerRole = req.user.role;
    const normalizedRole = String(reviewerRole || '').trim().toUpperCase();
    const employeeScope = await resolveHierarchyEmployeeScope(req.user);

    let allowedStages = [];
    if (normalizedRole === 'ASM') {
      allowedStages = ['KYC_SUBMITTED'];
    } else if (['RSM', 'STATE HEAD', 'SH'].includes(normalizedRole)) {
      allowedStages = [
        'ASM_APPROVED',
        'PENDING_BACK_OFFICE_REVIEW',
        'BACK_OFFICE_APPROVED',
        'CUSTOMER_CREATED',
        'LOAN_INITIATED',
        'PAYMENT_COMPLETED',
        'ORDER_CONFIRMED',
        'MATERIAL_DISPATCHED',
        'TECHNICIAN_ASSIGNED',
        'TECHNICIAN_VISITED',
        'INSTALLATION_IN_PROGRESS',
      ];
    } else if (hasFullAccess(reviewerRole)) {
      allowedStages = [
        'LEAD_CREATED',
        'KYC_SUBMITTED',
        'ASM_APPROVED',
        'PENDING_BACK_OFFICE_REVIEW',
        'BACK_OFFICE_APPROVED',
        'CUSTOMER_CREATED',
        'LOAN_INITIATED',
        'PAYMENT_COMPLETED',
        'ORDER_CONFIRMED',
        'MATERIAL_DISPATCHED',
        'TECHNICIAN_ASSIGNED',
        'TECHNICIAN_VISITED',
        'INSTALLATION_IN_PROGRESS',
      ];
    } else {
      return res.status(200).json({ data: [] });
    }

    let creatorFilter = {};
    if (employeeScope && employeeScope.length === 0) {
      return res.status(200).json({ data: [] });
    }

    if (employeeScope) {
      const subordinateIds = employeeScope.filter((id) => id !== req.user.id);
      if (subordinateIds.length === 0) {
        return res.status(200).json({ data: [] });
      }
      creatorFilter = { createdById: { [Op.in]: subordinateIds } };
    }

    const leads = await Lead.findAll({
      where: {
        isActive: true,
        ...creatorFilter,
      },
      include: [
        {
          model: LeadExtension,
          required: true,
          where: { stage: { [Op.in]: allowedStages } },
          attributes: ['stage', 'unitCapacitySelection', 'createdAt'],
        },
        {
          model: Route,
          required: false,
          attributes: ['routeName', 'routeCode'],
        },
        {
          model: Employee,
          as: 'Creator',
          required: false,
          attributes: ['fullName', 'empId'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    const data = leads.map((lead) => ({
      id: lead.id,
      leadName: lead.leadName,
      contactNumber: lead.contactNumber,
      routeId: lead.routeId,
      status: lead.status,
      stage: lead.LeadExtension?.stage || null,
      unitCapacitySelection: lead.LeadExtension?.unitCapacitySelection || null,
      assignedTechnicianId: lead.LeadExtension?.assignedTechnicianId || null,
      routeName: lead.Route?.routeName || null,
      routeCode: lead.Route?.routeCode || null,
      executiveName: lead.Creator?.fullName || 'Unknown',
      executiveEmpId: lead.Creator?.empId || null,
      createdAt: lead.createdAt,
    }));

    return res.status(200).json({ data });
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching approval queue', error: error.message });
  }
};

// 1E. TECHNICIAN OPTIONS FOR MANUAL ASSIGNMENT
exports.getTechnicianOptions = async (req, res) => {
  try {
    const { routeId } = req.query;

    const where = { role: 'Technician', isActive: true };
    let technicians = [];

    if (routeId) {
      const mapped = await EmployeeRoute.findAll({
        where: { routeId },
        attributes: ['employeeId'],
      });

      const mappedIds = mapped.map((m) => m.employeeId);
      if (mappedIds.length > 0) {
        technicians = await Employee.findAll({
          where: { ...where, id: { [Op.in]: mappedIds } },
          attributes: ['id', 'empId', 'fullName'],
          order: [['fullName', 'ASC']],
        });
      }
    }

    if (technicians.length === 0) {
      technicians = await Employee.findAll({
        where,
        attributes: ['id', 'empId', 'fullName'],
        order: [['fullName', 'ASC']],
      });
    }

    const data = technicians.map((tech) => ({
      id: tech.id,
      empId: tech.empId,
      fullName: tech.fullName,
    }));

    return res.status(200).json({ data });
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching technician options', error: error.message });
  }
};