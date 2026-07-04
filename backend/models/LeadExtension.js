const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LeadExtension = sequelize.define('LeadExtension', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  leadId: { type: DataTypes.UUID, allowNull: false },
  unitCapacitySelection: { type: DataTypes.STRING, allowNull: false }, // Fetched from Group SKU Master
  
  // Workflow Phase Tracking Flags
  stage: { 
    type: DataTypes.ENUM(
      'LEAD_CREATED',
      'KYC_SUBMITTED',
      'ASM_APPROVED',
      'PENDING_BACK_OFFICE_REVIEW',
      'BACK_OFFICE_APPROVED',
      'CUSTOMER_CREATED',
      'LOAN_INITIATED',
      'LOAN_APPROVED',
      'PAYMENT_COMPLETED',
      'ORDER_CONFIRMED',
      'MATERIAL_DISPATCHED',
      'MATERIAL_DELIVERED',
      'TECHNICIAN_ASSIGNED',
      'TECHNICIAN_VISITED',
      'INSTALLATION_IN_PROGRESS',
      'INSTALLATION_COMPLETED',
      'CUSTOMER_CONVERTED'
    ), 
    defaultValue: 'LEAD_CREATED' 
  },
  
  // KYC Encrypted Documents Storage Pointers (S3 Buckets or CDN Links)
  panCardNumber: { type: DataTypes.STRING, allowNull: true },
  aadhaarNumber: { type: DataTypes.STRING, allowNull: true },
  aadhaarMaskedReference: { type: DataTypes.STRING, allowNull: true },
  ebBillNumber: { type: DataTypes.STRING, allowNull: true },
  bankDetails: { type: DataTypes.TEXT, allowNull: true },
  ebLetterNumber: { type: DataTypes.STRING, allowNull: true },
  panCardDocUrl: { type: DataTypes.STRING, allowNull: true },
  aadhaarDocUrl: { type: DataTypes.STRING, allowNull: true },
  ebBillUrl: { type: DataTypes.STRING, allowNull: true },
  bankStatementUrl: { type: DataTypes.STRING, allowNull: true },
  ebApprovalDocUrl: { type: DataTypes.STRING, allowNull: true },
  
  // Workflow Approval Auditing Columns
  asmApprovedBy: { type: DataTypes.UUID, allowNull: true },
  backOfficeApprovedBy: { type: DataTypes.UUID, allowNull: true },
  loanApprovalReference: { type: DataTypes.STRING, allowNull: true },
  assignedTechnicianId: { type: DataTypes.UUID, allowNull: true },
  orderReference: { type: DataTypes.STRING, allowNull: true },
  paymentReference: { type: DataTypes.STRING, allowNull: true }
}, { tableName: 'lead_extensions', timestamps: true });

module.exports = LeadExtension;