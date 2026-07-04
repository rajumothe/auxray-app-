const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TrackingLog = sequelize.define('TrackingLog', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  employeeId: { type: DataTypes.UUID, allowNull: false },
  checkInTime: { type: DataTypes.DATE, allowNull: false },
  checkInLat: { type: DataTypes.DECIMAL(10, 8), allowNull: true },
  checkInLng: { type: DataTypes.DECIMAL(11, 8), allowNull: true },
  checkOutTime: { type: DataTypes.DATE, allowNull: true },
  checkOutLat: { type: DataTypes.DECIMAL(10, 8), allowNull: true },
  checkOutLng: { type: DataTypes.DECIMAL(11, 8), allowNull: true },
  totalDistanceKm: { type: DataTypes.DECIMAL(8, 2), defaultValue: 0.00 },
  taAmount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.00 },
  daAmount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.00 },
  status: { type: DataTypes.ENUM('ACTIVE', 'COMPLETED'), defaultValue: 'ACTIVE' }
}, { tableName: 'tracking_logs', timestamps: true });

module.exports = TrackingLog;