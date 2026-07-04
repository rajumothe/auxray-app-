const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Route = sequelize.define('Route', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  serialNumber: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  routeName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  routeCode: {
    type: DataTypes.STRING(10),
    allowNull: false,
    unique: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  }
}, {
  timestamps: true,
  tableName: 'routes'
});

module.exports = Route;