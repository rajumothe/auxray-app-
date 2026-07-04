const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Attendance = sequelize.define('Attendance', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  checkInTime: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  checkInLat: {
    type: DataTypes.DECIMAL(10, 8),
  },
  checkInLng: {
    type: DataTypes.DECIMAL(11, 8),
  },
  checkOutTime: {
    type: DataTypes.DATE,
    allowNull: true, // Will be null until the employee checks out
  },
  checkOutLat: {
    type: DataTypes.DECIMAL(10, 8),
  },
  checkOutLng: {
    type: DataTypes.DECIMAL(11, 8),
  },
  totalWorkHours: {
    type: DataTypes.FLOAT, // Calculated automatically upon check-out
    allowNull: true,
  },
  totalKmsTraveled: {
    type: DataTypes.FLOAT, // Captured from the mobile app's background GPS tracking
    defaultValue: 0.0,
  }
}, {
  timestamps: true,
  tableName: 'attendances'
});

module.exports = Attendance;