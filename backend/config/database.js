const { Sequelize } = require('sequelize');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const toInteger = (value, fallback) => {
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const toBoolean = (value, fallback = false) => {
  if (value === undefined) return fallback;
  return String(value).toLowerCase() === 'true';
};

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: process.env.DB_DIALECT || 'mysql',
    
    // Only log SQL queries in the console if we are in development mode
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    
    // 1. Force Sequelize to read and write in Indian Standard Time (IST)
    timezone: '+05:30', 
    
    // 2. Advanced Connection Pooling (Prevents DB crashing under heavy load)
    pool: {
      max: toInteger(process.env.DB_POOL_MAX, 5),
      min: toInteger(process.env.DB_POOL_MIN, 0),
      acquire: toInteger(process.env.DB_POOL_ACQUIRE, 30000),
      idle: toInteger(process.env.DB_POOL_IDLE, 10000)
    },
    
    // 3. Ensure MySQL returns dates exactly as they are saved in IST, not converted
    dialectOptions: {
      ...(toBoolean(process.env.DB_SSL, false)
        ? {
            ssl: {
              require: true,
              rejectUnauthorized: toBoolean(process.env.DB_SSL_REJECT_UNAUTHORIZED, false),
            },
          }
        : {}),
      dateStrings: true,
      typeCast: function (field, next) { 
        if (field.type === 'DATETIME') {
          return field.string();
        }
        return next();
      }
    }
  }
);

module.exports = sequelize;