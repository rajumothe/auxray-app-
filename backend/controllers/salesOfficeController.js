const { SalesOffice, Plant } = require('../models');

exports.createSalesOffice = async (req, res) => {
  try {
    const { officeName, officeCode, fullAddress, plantId } = req.body;
    
    const plant = await Plant.findOne({ where: { id: plantId, isActive: true } });
    if (!plant) return res.status(404).json({ message: 'Parent Plant not found or inactive.' });

    const newOffice = await SalesOffice.create({ officeName, officeCode, fullAddress, plantId });
    res.status(201).json({ message: 'Sales Office created successfully', data: newOffice });
  } catch (error) {
    res.status(500).json({ message: 'Error creating Sales Office', error: error.message });
  }
};

exports.getAllSalesOffices = async (req, res) => {
  try {
    const offices = await SalesOffice.findAll({ 
      where: { isActive: true },
      include: [{ model: Plant, attributes: ['plantName', 'plantCode'] }] 
    });
    res.status(200).json({ data: offices });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching Sales Offices', error: error.message });
  }
};

exports.updateSalesOffice = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await SalesOffice.update(req.body, { where: { id } });
    if (updated[0] === 0) return res.status(404).json({ message: 'Sales Office not found' });
    res.status(200).json({ message: 'Sales Office updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating Sales Office', error: error.message });
  }
};

exports.deactivateSalesOffice = async (req, res) => {
  try {
    const { id } = req.params;
    const deactivated = await SalesOffice.update({ isActive: false }, { where: { id } });
    if (deactivated[0] === 0) return res.status(404).json({ message: 'Sales Office not found' });
    res.status(200).json({ message: 'Sales Office deactivated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deactivating Sales Office', error: error.message });
  }
};