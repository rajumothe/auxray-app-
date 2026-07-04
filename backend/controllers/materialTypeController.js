const { MaterialType } = require('../models');

exports.createMaterialType = async (req, res) => {
  try {
    const { shortCode, description } = req.body;
    const cleanCode = shortCode.toUpperCase();

    const existing = await MaterialType.findOne({ where: { shortCode: cleanCode } });
    if (existing) return res.status(400).json({ message: 'Material Type Short Code already exists.' });

    const newType = await MaterialType.create({ shortCode: cleanCode, description });
    res.status(201).json({ message: 'Material Type created successfully', data: newType });
  } catch (error) {
    res.status(500).json({ message: 'Error creating material type', error: error.message });
  }
};

exports.getAllMaterialTypes = async (req, res) => {
  try {
    const types = await MaterialType.findAll();
    res.status(200).json({ data: types });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching material types', error: error.message });
  }
};