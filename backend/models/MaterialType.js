const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MaterialType = sequelize.define('MaterialType', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  shortCode: {
    type: DataTypes.STRING(4), // Enforces 4 character max limit
    allowNull: false,
    unique: true, // e.g., 'MECH', 'ELEC', 'SPAR'
  },
  description: {
    type: DataTypes.STRING,
    allowNull: false,
  }
}, {
  timestamps: true,
  tableName: 'material_types'
});

module.exports = MaterialType;