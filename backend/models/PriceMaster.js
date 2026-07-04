const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PriceMaster = sequelize.define('PriceMaster', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  skuId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  effectiveFrom: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  effectiveTo: {
    type: DataTypes.DATEONLY,
    allowNull: true, 
  },
  customerId: { type: DataTypes.UUID, allowNull: true },
  routeId: { type: DataTypes.UUID, allowNull: true },
  salesOfficeId: { type: DataTypes.UUID, allowNull: true },
  plantId: { type: DataTypes.UUID, allowNull: true },
  companyId: { type: DataTypes.UUID, allowNull: true },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  }
}, {
  timestamps: true,
  tableName: 'price_masters'
});

module.exports = PriceMaster;