const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Leave = sequelize.define('Leave', {
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
  leaveType: {
    type: DataTypes.ENUM('Casual Leave', 'Sick Leave', 'Privilege Leave', 'On Duty', 'Comp Off'),
    allowNull: false,
  },
  startDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  endDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('Pending', 'Approved', 'Rejected'),
    defaultValue: 'Pending',
  },
  approvedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  }
}, {
  timestamps: true,
  tableName: 'leaves'
});

module.exports = Leave;