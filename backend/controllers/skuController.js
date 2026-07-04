const { SKU, MaterialType } = require('../models');

exports.createSKU = async (req, res) => {
  try {
    // 1. Accept materialTypeId from req.body
    const { itemName, uom, materialTypeId } = req.body;

    if (!materialTypeId) {
      return res.status(400).json({ message: 'Material Type Assignment is required.' });
    }

    // 2. Persist materialTypeId to database row
    const newSKU = await SKU.create({ itemName, uom, materialTypeId });
    res.status(201).json({ message: 'SKU created successfully', data: newSKU });
  } catch (error) {
    res.status(500).json({ message: 'Error creating SKU entry', error: error.message });
  }
};

exports.getAllSKUs = async (req, res) => {
  try {
    // 3. Include MaterialType model so your frontend .MaterialType mapping expressions work!
    const skus = await SKU.findAll({ 
      where: { isActive: true },
      include: [{
        model: MaterialType,
        attributes: ['shortCode', 'description'] // limit fields returned for optimized payloads
      }]
    });
    res.status(200).json({ data: skus });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching SKU Master', error: error.message });
  }
};

exports.updateSKU = async (req, res) => {
  try {
    const { id } = req.params;
    // 4. Extract materialTypeId here too for updating existing records
    const { itemName, uom, materialTypeId } = req.body;

    const updated = await SKU.update(
      { itemName, uom, materialTypeId }, 
      { where: { id } }
    );
    
    if (updated[0] === 0) return res.status(404).json({ message: 'SKU record not found' });
    res.status(200).json({ message: 'SKU record updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating SKU details', error: error.message });
  }
};

exports.deactivateSKU = async (req, res) => {
  try {
    const { id } = req.params;
    await SKU.update({ isActive: false }, { where: { id } });
    res.status(200).json({ message: 'SKU deactivated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deactivating SKU', error: error.message });
  }
};