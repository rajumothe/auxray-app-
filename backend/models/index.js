const sequelize = require('../config/database');

// Import All System Master Models
const Company = require('./Company');
const Plant = require('./Plant');
const SalesOffice = require('./SalesOffice');
const Route = require('./Route');
const Employee = require('./Employee');
const EmployeeSalesOffice = require('./EmployeeSalesOffice');
const EmployeeRoute = require('./EmployeeRoute');
const Customer = require('./Customer');
const MaterialType = require('./MaterialType');
const SKU = require('./SKU');
const Lead = require('./Lead');
const Attendance = require('./Attendance');
const Visit = require('./Visit');
const Leave = require('./Leave');
const ExpenseClaim = require('./ExpenseClaim');
const PriceMaster = require('./PriceMaster');
const TaxMaster = require('./TaxMaster');
const TrackingLog = require('./TrackingLog');
const TrackingPoint = require('./TrackingPoint');
const LeadExtension = require('./LeadExtension');
const ServiceTicket = require('./ServiceTicket');
const AuditLog = require('./AuditLog');

// --- Define Associations ---

// 1. Core Geographical Structural Cascade
Company.hasMany(Plant, { foreignKey: 'companyId', onDelete: 'CASCADE' });
Plant.belongsTo(Company, { foreignKey: 'companyId' });

Plant.hasMany(SalesOffice, { foreignKey: 'plantId', onDelete: 'CASCADE' });
SalesOffice.belongsTo(Plant, { foreignKey: 'plantId' });

SalesOffice.hasMany(Route, { foreignKey: 'salesOfficeId', onDelete: 'CASCADE' });
Route.belongsTo(SalesOffice, { foreignKey: 'salesOfficeId' });

Route.hasMany(Customer, { foreignKey: 'routeId' });
Customer.belongsTo(Route, { foreignKey: 'routeId' });

// 2. Employee Hierarchy (Self-referential Reporting Structure)
Employee.hasMany(Employee, { as: 'Subordinates', foreignKey: 'managerId' });
Employee.belongsTo(Employee, { as: 'Manager', foreignKey: 'managerId' });

// 3. Multi-Territory Assignments
Employee.belongsToMany(SalesOffice, { through: EmployeeSalesOffice, foreignKey: 'employeeId' });
SalesOffice.belongsToMany(Employee, { through: EmployeeSalesOffice, foreignKey: 'salesOfficeId' });

Employee.belongsToMany(Route, { through: EmployeeRoute, foreignKey: 'employeeId' });
Route.belongsToMany(Employee, { through: EmployeeRoute, foreignKey: 'routeId' });

// 4. Product SKU & Grouping Hierarchy
MaterialType.hasMany(SKU, { foreignKey: 'materialTypeId' });
SKU.belongsTo(MaterialType, { foreignKey: 'materialTypeId' });

// 5. Operational Dynamics Mapping (Leads, Attendance, Visits, Leaves)
Route.hasMany(Lead, { foreignKey: 'routeId' });
Lead.belongsTo(Route, { foreignKey: 'routeId' });

Employee.hasMany(Lead, { foreignKey: 'createdById' });
Lead.belongsTo(Employee, { as: 'Creator', foreignKey: 'createdById' });

Employee.hasMany(Attendance, { foreignKey: 'employeeId' });
Attendance.belongsTo(Employee, { foreignKey: 'employeeId' });

Employee.hasMany(Visit, { foreignKey: 'employeeId' });
Visit.belongsTo(Employee, { foreignKey: 'employeeId' });

Lead.hasMany(Visit, { foreignKey: 'leadId' });
Visit.belongsTo(Lead, { foreignKey: 'leadId' });

Customer.hasMany(Visit, { foreignKey: 'customerId' });
Visit.belongsTo(Customer, { foreignKey: 'customerId' });

Employee.hasMany(Leave, { foreignKey: 'employeeId' });
Leave.belongsTo(Employee, { foreignKey: 'employeeId' });

Employee.hasMany(Leave, { foreignKey: 'approvedById' });
Leave.belongsTo(Employee, { as: 'Approver', foreignKey: 'approvedById' });

Employee.hasMany(ExpenseClaim, { foreignKey: 'employeeId' });
ExpenseClaim.belongsTo(Employee, { foreignKey: 'employeeId' });

Employee.hasMany(ExpenseClaim, { foreignKey: 'approvedById' });
ExpenseClaim.belongsTo(Employee, { as: 'Approver', foreignKey: 'approvedById' });

// 6. Financial Parameter Assigments (Corrected to direct target SKUs)
SKU.hasMany(PriceMaster, { foreignKey: 'skuId', onDelete: 'CASCADE' });
PriceMaster.belongsTo(SKU, { foreignKey: 'skuId' });

SKU.hasMany(TaxMaster, { foreignKey: 'skuId', onDelete: 'CASCADE' });
TaxMaster.belongsTo(SKU, { foreignKey: 'skuId' });


// ADD THESE CORE RELATIONSHIPS SO EAGER LOADING WORKS:
Company.hasMany(PriceMaster, { foreignKey: 'companyId' });
PriceMaster.belongsTo(Company, { foreignKey: 'companyId' });

Plant.hasMany(PriceMaster, { foreignKey: 'plantId' });
PriceMaster.belongsTo(Plant, { foreignKey: 'plantId' });

SalesOffice.hasMany(PriceMaster, { foreignKey: 'salesOfficeId' });
PriceMaster.belongsTo(SalesOffice, { foreignKey: 'salesOfficeId' });

Route.hasMany(PriceMaster, { foreignKey: 'routeId' });
PriceMaster.belongsTo(Route, { foreignKey: 'routeId' });

// Employee -> Tracking Session Connections
Employee.hasMany(TrackingLog, { foreignKey: 'employeeId', onDelete: 'CASCADE' });
TrackingLog.belongsTo(Employee, { foreignKey: 'employeeId' });

TrackingLog.hasMany(TrackingPoint, { foreignKey: 'trackingLogId', onDelete: 'CASCADE' });
TrackingPoint.belongsTo(TrackingLog, { foreignKey: 'trackingLogId' });

Employee.hasMany(TrackingPoint, { foreignKey: 'employeeId', onDelete: 'CASCADE' });
TrackingPoint.belongsTo(Employee, { foreignKey: 'employeeId' });

// Core Lead to Multi-Step KYC Extended Attribute Map
Lead.hasOne(LeadExtension, { foreignKey: 'leadId', onDelete: 'CASCADE' });
LeadExtension.belongsTo(Lead, { foreignKey: 'leadId' });

// Link approval steps back to the Employee directory for audit trails
Employee.hasMany(LeadExtension, { foreignKey: 'asmApprovedBy' });
LeadExtension.belongsTo(Employee, { as: 'ASM_Approver', foreignKey: 'asmApprovedBy' });

Employee.hasMany(LeadExtension, { foreignKey: 'backOfficeApprovedBy' });
LeadExtension.belongsTo(Employee, { as: 'BO_Approver', foreignKey: 'backOfficeApprovedBy' });

Employee.hasMany(Lead, { as: 'CreatedLeads', foreignKey: 'createdById' });


// Customer -> Service Tickets (One-to-Many)
Customer.hasMany(ServiceTicket, { foreignKey: 'customerId', onDelete: 'CASCADE' });
ServiceTicket.belongsTo(Customer, { foreignKey: 'customerId' });

// Technician (Employee) -> Service Tickets (One-to-Many)
Employee.hasMany(ServiceTicket, { foreignKey: 'technicianId' });
ServiceTicket.belongsTo(Employee, { as: 'Technician', foreignKey: 'technicianId' });

// Creator (Employee - e.g., Executive or Back Office) -> Service Tickets
Employee.hasMany(ServiceTicket, { foreignKey: 'raisedById' });
ServiceTicket.belongsTo(Employee, { as: 'Issuer', foreignKey: 'raisedById' });

Company.hasMany(Employee, { foreignKey: 'companyId' });
Employee.belongsTo(Company, { foreignKey: 'companyId' });

Employee.hasMany(AuditLog, { foreignKey: 'employeeId' });
AuditLog.belongsTo(Employee, { foreignKey: 'employeeId' });



module.exports = {
  sequelize,
  Company,
  Plant,
  SalesOffice,
  Route,
  Employee,
  Customer,
  MaterialType,
  SKU,
  Lead,
  Attendance,
  Visit,
  Leave,
  ExpenseClaim,
  PriceMaster,
  TaxMaster,
  EmployeeSalesOffice,
  EmployeeRoute,
  TrackingLog,
  TrackingPoint,
  LeadExtension,
  ServiceTicket,
  AuditLog,
};