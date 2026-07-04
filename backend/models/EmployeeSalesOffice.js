const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EmployeeSalesOffice = sequelize.define('EmployeeSalesOffice', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  }
}, { 
  timestamps: false, 
  tableName: 'employee_sales_offices' 
});

module.exports = EmployeeSalesOffice;