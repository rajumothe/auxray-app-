const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ExpenseClaim = sequelize.define('ExpenseClaim', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  employeeId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  approvedById: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  claimType: {
    type: DataTypes.ENUM('TA_DA', 'ANCILLARY', 'TA_DA_ANCILLARY'),
    defaultValue: 'TA_DA_ANCILLARY',
  },
  distanceKm: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
  },
  taAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
  },
  daAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
  },
  ancillaryAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
  },
  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  billAttached: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  status: {
    type: DataTypes.ENUM('Pending', 'Approved', 'Rejected'),
    defaultValue: 'Pending',
  },
  approvedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  timestamps: true,
  tableName: 'expense_claims',
});

module.exports = ExpenseClaim;