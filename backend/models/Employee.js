const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcrypt');

const Employee = sequelize.define('Employee', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  fullName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmail: true,
    },
  },
  mobileNumber: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
  alternateNumber: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  companyId: {
    type: DataTypes.UUID,
    allowNull: false, // Bound directly to multi-tenant entity maps
    references: {
      model: 'companies',
      key: 'id'
    }
  }, // ⚡ FIXED: Added missing closing bracket here
  
  // 🌟 AUTOMATIC COUNTER FIELD (Unique across table records)
  serialNo: {
    type: DataTypes.INTEGER,
    unique: true,
    allowNull: false
  },
  // 🌟 THE FINAL GENERATED STRING (Computed dynamically relative to Company + Role context)
  empId: {
    type: DataTypes.STRING,
    allowNull: true, // Nullable temporarily during standard schema pre-validation checks
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('HOD', 'State Head', 'RSM', 'ASM', 'Executive', 'Technician', 'Back Office'),
    allowNull: false,
  },
  managerId: {
    type: DataTypes.UUID,
    allowNull: true, 
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  }
}, {
  timestamps: true,
  tableName: 'employees',
  hooks: {
    // 🌟 HOOK A: RUNS BEFORE INSTANCE VALIDATION TO COMPOSE THE AUTO-ID
    beforeValidate: async (employee) => {
      if (employee.isNewRecord) {
        try {
          // Safety intercept check if someone registers without passing company context
          if (!employee.companyId) {
            throw new Error('Cannot compute sequence parameters. companyId is required.');
          }

          // 🌟 SCALABLE MULTI-TENANT FIX: Look up max record *specifically within their own company*
          const maxRecord = await Employee.findOne({
            where: { companyId: employee.companyId },
            order: [['serialNo', 'DESC']],
            attributes: ['serialNo'],
            raw: true
          });

          // Enforce baseline criteria starting explicitly at 200000 for each separate tenant
          const nextSerial = maxRecord && maxRecord.serialNo ? maxRecord.serialNo + 1 : 200000;
          employee.serialNo = nextSerial;

          // Compute correct character sequence rules mapping your custom roles matrix
          let prefix = 'E'; // Default: Executive
          if (employee.role === 'HOD' || employee.role === 'State Head') prefix = 'A';
          else if (employee.role === 'RSM') prefix = 'R';
          else if (employee.role === 'ASM') prefix = 'A';
          else if (employee.role === 'Technician') prefix = 'T';
          else if (employee.role === 'Back Office') prefix = 'B';

          // Bind result directly (e.g., "A-200000")
          employee.empId = `${prefix}-${nextSerial}`;
        } catch (err) {
          console.error('Failed to compute auto-incrementing token sequence:', err.message);
          throw err;
        }
      }
    },

    // HOOK B: HASH CRYPTOGRAPHY
    beforeCreate: async (employee) => {
      if (employee.password) {
        const salt = await bcrypt.genSalt(12);
        employee.password = await bcrypt.hash(employee.password, salt);
      }
    },
    beforeUpdate: async (employee) => {
      if (employee.changed('password')) {
        const salt = await bcrypt.genSalt(12);
        employee.password = await bcrypt.hash(employee.password, salt);
      }
    }
  }
});

Employee.prototype.isValidPassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = Employee;