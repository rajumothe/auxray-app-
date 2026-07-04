const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ServiceTicket = sequelize.define('ServiceTicket', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  customerId: { type: DataTypes.UUID, allowNull: false },
  raisedById: { type: DataTypes.UUID, allowNull: false }, // Executive or Customer ID
  technicianId: { type: DataTypes.UUID, allowNull: true },
  pinCode: { type: DataTypes.STRING(10), allowNull: false },
  issueDescription: { type: DataTypes.TEXT, allowNull: false },
  status: { type: DataTypes.ENUM('FRESH', 'ASSIGNED', 'TRAVELLING', 'STARTED', 'SPARE_DELAYED', 'RESOLVED'), defaultValue: 'FRESH' },
  photoProofUrl: { type: DataTypes.STRING, allowNull: true },
  digitalSignatureUrl: { type: DataTypes.STRING, allowNull: true },
  extendedDate: { type: DataTypes.DATEONLY, allowNull: true }
}, { tableName: 'service_tickets', timestamps: true });

module.exports = ServiceTicket;