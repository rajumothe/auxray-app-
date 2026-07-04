const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AuditLog = sequelize.define('AuditLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  employeeId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  empId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  role: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  method: {
    type: DataTypes.STRING(10),
    allowNull: false,
  },
  action: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
  module: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  endpoint: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  entityId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  requestBody: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  queryParams: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  responseStatus: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  responseBody: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  ipAddress: {
    type: DataTypes.STRING(64),
    allowNull: true,
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  durationMs: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  success: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  timestamps: true,
  tableName: 'audit_logs',
});

module.exports = AuditLog;
