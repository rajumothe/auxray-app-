const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Visit = sequelize.define('Visit', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  visitDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  checkInTime: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  checkOutTime: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  visitLat: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: false,
  },
  visitLng: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: false,
  },
  purpose: {
    type: DataTypes.STRING, // e.g., "Sales Pitch", "Installation", "Maintenance"
  },
  remarks: {
    type: DataTypes.TEXT,
  }
}, {
  timestamps: true,
  tableName: 'visits'
});

module.exports = Visit;