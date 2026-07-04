const { Employee, SalesOffice, Route, EmployeeSalesOffice, EmployeeRoute } = require('../models');
const sequelize = require('../config/database');

// 1. REGISTER NEW EMPLOYEE PROFILE
exports.createEmployee = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const {
      fullName,
      email,
      mobileNumber,
      alternateNumber,
      address,
      password,
      role,
      managerId,
      salesOfficeIds,
      routeIds
    } = req.body;

    if (!fullName || !mobileNumber || !password || !role) {
      await t.rollback();
      return res.status(400).json({ message: 'Full Name, Mobile Number, Password, and Access Role are required parameters.' });
    }

    // 🌟 THE Sequelize hook (beforeValidate) WILL AUTOMATICALLY INTRODUCE THE SERIAL & PREFIX HERE
    const newEmp = await Employee.create({
      fullName,
      email: email || null,
      mobileNumber,
      alternateNumber: alternateNumber || null,
      address: address || null,
      password,
      role,
      companyId: req.user.companyId,
      managerId: managerId || null,
      isActive: true
    }, { transaction: t });

    // State Head, RSM, ASM mapping to multiple offices
    if (['State Head', 'RSM', 'ASM'].includes(role) && salesOfficeIds?.length > 0) {
      const mappings = salesOfficeIds.map(id => ({ employeeId: newEmp.id, salesOfficeId: id }));
      await EmployeeSalesOffice.bulkCreate(mappings, { transaction: t });
    }

    // Executive, Technician mapping to multiple routes
    if (['Executive', 'Technician'].includes(role) && routeIds?.length > 0) {
      const mappings = routeIds.map(id => ({ employeeId: newEmp.id, routeId: id }));
      await EmployeeRoute.bulkCreate(mappings, { transaction: t });
    }

    await t.commit();
    
    // Returns status 211 along with your newly auto-generated empId (e.g. A-200004)
    res.status(201).json({ 
      message: 'Employee registered successfully', 
      data: {
        id: newEmp.id,
        fullName: newEmp.fullName,
        empId: newEmp.empId, // 🌟 Dynamic output token
        role: newEmp.role,
        email: newEmp.email,
        mobileNumber: newEmp.mobileNumber
      } 
    });
  } catch (error) {
    await t.rollback();
    res.status(500).json({ message: 'Error registering Employee profile', error: error.message });
  }
};

// 2. FETCH ALL ACTIVE RECORD LISTS
exports.getAllEmployees = async (req, res) => {
  try {
    const employees = await Employee.findAll({
      where: { isActive: true },
      attributes: { exclude: ['password'] },
      include: [
        { model: Employee, as: 'Manager', attributes: ['fullName', 'role'] },
        { model: SalesOffice, attributes: ['officeName', 'officeCode'], through: { attributes: [] } },
        { model: Route, attributes: ['routeName', 'routeCode'], through: { attributes: [] } }
      ]
    });
    res.status(200).json({ data: employees });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching roster', error: error.message });
  }
};

// 3. UPDATE EXISTING PROFILE VARIABLE SCHEMAS
exports.updateEmployee = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const {
      fullName,
      email,
      mobileNumber,
      alternateNumber,
      address,
      password,
      role,
      managerId,
      salesOfficeIds,
      routeIds
    } = req.body;

    if (!fullName || !mobileNumber || !role) {
      await t.rollback();
      return res.status(400).json({ message: 'Full Name, Mobile Number, and Access Role are required parameters.' });
    }

    const updatePayload = {
      fullName,
      email: email || null,
      mobileNumber,
      alternateNumber: alternateNumber || null,
      address: address || null,
      role,
      managerId: managerId || null
    };
    if (password) updatePayload.password = password; // Triggers encrypt update hook if string passed

    await Employee.update(updatePayload, { where: { id }, transaction: t });

    // Reset and rebuild multi-assignments mapping relationships safely inside our block isolation layer
    await EmployeeSalesOffice.destroy({ where: { employeeId: id }, transaction: t });
    await EmployeeRoute.destroy({ where: { employeeId: id }, transaction: t });

    if (['State Head', 'RSM', 'ASM'].includes(role) && salesOfficeIds?.length > 0) {
      const mappings = salesOfficeIds.map(soId => ({ employeeId: id, salesOfficeId: soId }));
      await EmployeeSalesOffice.bulkCreate(mappings, { transaction: t });
    }

    if (['Executive', 'Technician'].includes(role) && routeIds?.length > 0) {
      const mappings = routeIds.map(rId => ({ employeeId: id, routeId: rId }));
      await EmployeeRoute.bulkCreate(mappings, { transaction: t });
    }

    await t.commit();
    res.status(200).json({ message: 'Employee profile updated successfully' });
  } catch (error) {
    await t.rollback();
    res.status(500).json({ message: 'Error updating employee profile', error: error.message });
  }
};

// 5. EMPLOYEE REPORT LIST (Lightweight roster export schema)
exports.getEmployeeReport = async (req, res) => {
  try {
    const employees = await Employee.findAll({
      where: { isActive: true },
      attributes: ['id', 'empId', 'fullName', 'role', 'email', 'mobileNumber', 'alternateNumber', 'address', 'createdAt'],
      include: [{ model: Employee, as: 'Manager', attributes: ['fullName', 'empId', 'role'] }],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({ data: employees });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching employee report', error: error.message });
  }
};

// 4. SOFT DEACTIVATE AN OPERATOR FROM THE TERMINAL
exports.deactivateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    await Employee.update({ isActive: false }, { where: { id } });
    res.status(200).json({ message: 'Employee deactivated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deactivating employee profile', error: error.message });
  }
};