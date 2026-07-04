const { Company } = require('../models');

// 1. 🔒 BLOCKED COMPANY CREATION GATEWAY
// System company rows are initialized exclusively through database seed scripts.
exports.createCompany = async (req, res) => {
  return res.status(403).json({ 
    success: false,
    message: 'Operation Forbidden. Corporate company nodes are generated automatically by system sequences and cannot be added manually.' 
  });
};

// 2. FETCH ALL ACTIVE COMPANIES (Isolates multi-tenant boundaries)
exports.getAllCompanies = async (req, res) => {
  try {
    const companies = await Company.findAll({ 
      where: { isActive: true },
      order: [['companyCode', 'ASC']] // Arranges the roster starting from code 1000 onwards
    });
    res.status(200).json({ success: true, data: companies });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching companies', error: error.message });
  }
};

// 3. UPDATE COMPANY COMPLIANCE METADATA (Enforces code immutability)
exports.updateCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      companyName,
      stateCode,
      gstNumber,
      panNumber,
      state,
      fullAddress,
      isActive,
      gstin,
      address
    } = req.body;

    const updatePayload = {
      companyName,
      stateCode,
      gstNumber: gstNumber ?? gstin,
      panNumber,
      state,
      fullAddress: fullAddress ?? address,
    };

    if (typeof isActive === 'boolean') {
      updatePayload.isActive = isActive;
    }

    // Ignore undefined fields to avoid writing nulls unintentionally.
    const sanitizedPayload = Object.fromEntries(
      Object.entries(updatePayload).filter(([, value]) => value !== undefined)
    );

    // 🌟 NOTICE: companyCode is explicitly omitted here to lock down the generated index safely
    const [updatedRowsCount] = await Company.update({ 
      ...sanitizedPayload
    }, { 
      where: { id } 
    });
    
    if (updatedRowsCount === 0) {
      return res.status(404).json({ success: false, message: 'Target company node not found.' });
    }
    
    res.status(200).json({ success: true, message: 'Company parameters modified successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating company parameters', error: error.message });
  }
};

// 4. DEACTIVATE (SOFT DELETE) A COMPANY
exports.deactivateCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const [deactivatedRowsCount] = await Company.update({ isActive: false }, { where: { id } });
    
    if (deactivatedRowsCount === 0) {
      return res.status(404).json({ success: false, message: 'Target company node not found.' });
    }
    
    res.status(200).json({ success: true, message: 'Company node deactivated successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error deactivating company profile node', error: error.message });
  }
};