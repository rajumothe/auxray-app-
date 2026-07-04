const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TaxMaster = sequelize.define('TaxMaster', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  skuId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  state: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  cgstRate: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0.00,
  },
  sgstRate: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0.00,
  },
  igstRate: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0.00,
  },
  hsnCode: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  }
}, {
  timestamps: true,
  tableName: 'tax_masters'
});

module.exports = TaxMaster;