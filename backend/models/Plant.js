const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Plant = sequelize.define('Plant', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  plantName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  plantCode: {
    type: DataTypes.STRING(10),
    allowNull: false,
    unique: true,
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  state: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  gstNumber: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  }
}, {
  timestamps: true,
  tableName: 'plants'
});

module.exports = Plant;