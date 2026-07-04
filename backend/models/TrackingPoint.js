const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TrackingPoint = sequelize.define('TrackingPoint', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  trackingLogId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  employeeId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: false,
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: false,
  },
  recordedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'tracking_points',
  timestamps: true,
});

module.exports = TrackingPoint;
