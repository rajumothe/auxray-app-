const { Employee, Company } = require('../models');

const mapProfile = (employee) => ({
  id: employee.id,
  fullName: employee.fullName,
  empId: employee.empId,
  role: employee.role,
  email: employee.email,
  mobileNumber: employee.mobileNumber,
  alternateNumber: employee.alternateNumber,
  address: employee.address,
  companyName: employee.Company?.companyName || null,
  managerName: employee.Manager?.fullName || null,
  managerEmpId: employee.Manager?.empId || null,
});

exports.getMyProfile = async (req, res) => {
  try {
    const employee = await Employee.findByPk(req.user.id, {
      attributes: ['id', 'fullName', 'empId', 'role', 'email', 'mobileNumber', 'alternateNumber', 'address'],
      include: [
        { model: Company, attributes: ['companyName'], required: false },
        { model: Employee, as: 'Manager', attributes: ['fullName', 'empId'], required: false },
      ],
    });

    if (!employee || !employee.isActive) {
      return res.status(404).json({ message: 'Profile not found.' });
    }

    return res.status(200).json({ data: mapProfile(employee) });
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
};

exports.updateMyPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required.' });
    }

    if (String(newPassword).trim().length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long.' });
    }

    const employee = await Employee.findByPk(req.user.id);
    if (!employee || !employee.isActive) {
      return res.status(404).json({ message: 'Profile not found.' });
    }

    const isMatch = await employee.isValidPassword(String(currentPassword));
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect.' });
    }

    employee.password = String(newPassword).trim();
    await employee.save();

    return res.status(200).json({ message: 'Password updated successfully.' });
  } catch (error) {
    return res.status(500).json({ message: 'Error updating password', error: error.message });
  }
};