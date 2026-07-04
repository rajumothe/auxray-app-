const { Plant, Company } = require('../models');

const resolveActiveCompanyId = async (tokenCompanyId) => {
  if (tokenCompanyId) {
    const tokenCompany = await Company.findOne({ where: { id: tokenCompanyId, isActive: true } });
    if (tokenCompany) {
      return tokenCompany.id;
    }
  }

  const fallbackCompany = await Company.findOne({
    where: { isActive: true },
    order: [['createdAt', 'ASC']],
  });

  return fallbackCompany ? fallbackCompany.id : null;
};

// 1. CREATE A NEW PLANT (Contextually bound to the user's active Company segment)
exports.createPlant = async (req, res) => {
  try {
    const { plantName, plantCode, address, state, gstNumber } = req.body;
    
    // 🌟 MULTI-TENANT RULE: Extracted directly from req.user set by your verifyToken middleware
    const userCompanyId = await resolveActiveCompanyId(req.user.companyId);
    if (!userCompanyId) {
      return res.status(404).json({ message: 'Parent Company profile context not found or inactive.' });
    }

    // Provision plant tied contextually to their verified business ecosystem partition
    const newPlant = await Plant.create({
      plantName, 
      plantCode, 
      address, 
      state, 
      gstNumber, 
      companyId: userCompanyId // 🔒 Securely enforced on the server-side
    });

    res.status(201).json({ 
      message: 'Plant created successfully', 
      data: newPlant 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating plant', error: error.message });
  }
};

// 2. GET ACTIVE PLANTS (Filtered specifically to show only the logged-in user's company plants)
exports.getAllPlants = async (req, res) => {
  try {
    const userCompanyId = await resolveActiveCompanyId(req.user.companyId);
    if (!userCompanyId) {
      return res.status(404).json({ message: 'Parent Company profile context not found or inactive.' });
    }

    const plants = await Plant.findAll({ 
      where: { 
        isActive: true,
        companyId: userCompanyId // 🔒 CRITICAL FILTER: Separates multi-tenant asset footprints
      },
      include: [{ 
        model: Company, 
        attributes: ['companyName', 'companyCode', 'state'] 
      }],
      order: [['plantCode', 'ASC']]
    });

    res.status(200).json({ data: plants });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching plants', error: error.message });
  }
};

// 3. UPDATE A PLANT (Scoped to prevent cross-tenant mutations)
exports.updatePlant = async (req, res) => {
  try {
    const { id } = req.params;
    const userCompanyId = await resolveActiveCompanyId(req.user.companyId);
    if (!userCompanyId) {
      return res.status(404).json({ message: 'Parent Company profile context not found or inactive.' });
    }
    const { plantName, plantCode, address, state, gstNumber } = req.body;

    // Enforce companyId in the where clause so users cannot modify another company's plants
    const [updatedCount] = await Plant.update(
      { plantName, plantCode, address, state, gstNumber }, 
      { where: { id, companyId: userCompanyId } }
    );
    
    if (updatedCount === 0) return res.status(404).json({ message: 'Plant not found or unauthorized modification attempt.' });
    res.status(200).json({ message: 'Plant updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating plant', error: error.message });
  }
};

// 4. DEACTIVATE (SOFT DELETE) A PLANT
exports.deactivatePlant = async (req, res) => {
  try {
    const { id } = req.params;
    const userCompanyId = await resolveActiveCompanyId(req.user.companyId);
    if (!userCompanyId) {
      return res.status(404).json({ message: 'Parent Company profile context not found or inactive.' });
    }

    const [deactivatedCount] = await Plant.update(
      { isActive: false }, 
      { where: { id, companyId: userCompanyId } }
    );
    
    if (deactivatedCount === 0) return res.status(404).json({ message: 'Plant not found or unauthorized.' });
    res.status(200).json({ message: 'Plant deactivated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deactivating plant', error: error.message });
  }
};