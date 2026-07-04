const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SKU = sequelize.define('SKU', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  itemCode: {
    // To get an auto-incrementing 5-digit number in UUID systems, 
    // we often use a separate integer sequence column.
    type: DataTypes.INTEGER,
    autoIncrement: true,
    unique: true, 
  },
  itemName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  uom: {
    type: DataTypes.ENUM('PC', 'Boxes', 'Mtrs', 'Eachs', 'Sets'),
    allowNull: false,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  }
}, {
  timestamps: true,
  tableName: 'skus'
});

module.exports = SKU;