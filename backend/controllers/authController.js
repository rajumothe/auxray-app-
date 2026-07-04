const jwt = require('jsonwebtoken');
const { Employee } = require('../models');

exports.login = async (req, res) => {
  try {
    const { empId, password } = req.body;

    if (!empId || !password) {
      return res.status(400).json({ message: 'Employee ID and password fields are required.' });
    }

    const cleanEmpId = empId.trim().toUpperCase();

    // 🌟 REGEX GATEWAY: Matches your prefix layout standard safely
    const corporateEmpIdRegex = /^[A-Z]-2\d{5}$/;
    if (!corporateEmpIdRegex.test(cleanEmpId)) {
      return res.status(400).json({ 
        message: 'Invalid Employee ID syntax configuration. Format example: A-200000.' 
      });
    }

    // 1. Trace record via index query execution
    const employee = await Employee.findOne({ where: { empId: cleanEmpId } });
    
    if (!employee || !employee.isActive) {
      return res.status(401).json({ message: 'Invalid credentials or inactive account.' });
    }

    // 2. Hash comparative audit verification
    const isMatch = await employee.isValidPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // 3. Issue Token
    // 🌟 CRITICAL MULTI-TENANT FIX: Added companyId into the encrypted JWT signature payload string!
    const payload = { 
      id: employee.id, 
      empId: employee.empId, 
      role: employee.role,
      companyId: employee.companyId // ⚡ Extracted cleanly from the database record instance
    };
    
    const token = jwt.sign(payload, process.env.JWT_SECRET, { 
      expiresIn: process.env.JWT_EXPIRES_IN || '30d' 
    });

    res.status(200).json({
      message: 'Login successful',
      token,
      user: { 
        id: employee.id, 
        fullName: employee.fullName, 
        empId: employee.empId, 
        role: employee.role,
        companyId: employee.companyId // ⚡ Return it back to state engines if needed by UI
      }
    });

  } catch (error) {
    console.error('Login Gateway Exception Failure:', error);
    res.status(500).json({ message: 'Server error during login execution.' });
  }
};