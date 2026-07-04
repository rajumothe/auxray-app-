const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Company = sequelize.define('Company', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  // 🌟 AUTOMATIC COUNTER FIELD (Starts explicitly at 1000)
  companyCode: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
  },
  companyName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  stateCode: {
    type: DataTypes.STRING(10),
    allowNull: true,
  },
  gstNumber: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  panNumber: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  state: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  fullAddress: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  }
}, {
  timestamps: true,
  tableName: 'companies',
  hooks: {
    // Automatically sets up code increments in the background if creating multiple groups
    beforeValidate: async (company) => {
      if (company.isNewRecord) {
        const maxRecord = await Company.findOne({
          order: [['companyCode', 'DESC']],
          attributes: ['companyCode'],
          raw: true
        });
        const nextCode = maxRecord && maxRecord.companyCode ? maxRecord.companyCode + 1 : 1000;
        company.companyCode = nextCode;
      }
    }
  }
});

module.exports = Company;