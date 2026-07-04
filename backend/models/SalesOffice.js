const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SalesOffice = sequelize.define('SalesOffice', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  officeName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  officeCode: {
    type: DataTypes.STRING(10),
    allowNull: false,
    unique: true,
  },
  fullAddress: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  }
}, {
  timestamps: true,
  tableName: 'sales_offices'
});

module.exports = SalesOffice;