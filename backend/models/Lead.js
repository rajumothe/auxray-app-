const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Lead = sequelize.define('Lead', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  leadName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  contactNumber: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  address: {
    type: DataTypes.TEXT,
  },
  pinCode: {
    type: DataTypes.STRING(10),
    allowNull: true,
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8), // Precision for GPS coordinates
    allowNull: false,
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'Pending Approval', // Web users will update this
  },
  routeId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  createdById: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  }
}, {
  timestamps: true,
  tableName: 'leads'
});

module.exports = Lead;