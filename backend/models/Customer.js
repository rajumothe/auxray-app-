const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Customer = sequelize.define('Customer', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  customerName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  contactNumber: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true, // Might be null if migrated from older systems
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  }
}, {
  timestamps: true,
  tableName: 'customers'
});

module.exports = Customer;