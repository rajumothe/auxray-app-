const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EmployeeRoute = sequelize.define('EmployeeRoute', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  }
}, { 
  timestamps: false, 
  tableName: 'employee_routes' 
});

module.exports = EmployeeRoute;