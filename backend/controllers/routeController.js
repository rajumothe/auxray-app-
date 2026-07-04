const { Route, SalesOffice } = require('../models');

exports.createRoute = async (req, res) => {
  try {
    const { serialNumber, routeName, routeCode, salesOfficeId } = req.body;
    
    const office = await SalesOffice.findOne({ where: { id: salesOfficeId, isActive: true } });
    if (!office) return res.status(404).json({ message: 'Parent Sales Office not found or inactive.' });

    const newRoute = await Route.create({ serialNumber, routeName, routeCode, salesOfficeId });
    res.status(201).json({ message: 'Route created successfully', data: newRoute });
  } catch (error) {
    res.status(500).json({ message: 'Error creating Route', error: error.message });
  }
};

exports.getAllRoutes = async (req, res) => {
  try {
    const routes = await Route.findAll({ 
      where: { isActive: true },
      include: [{ model: SalesOffice, attributes: ['officeName', 'officeCode'] }] 
    });
    res.status(200).json({ data: routes });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching Routes', error: error.message });
  }
};

exports.updateRoute = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Route.update(req.body, { where: { id } });
    if (updated[0] === 0) return res.status(404).json({ message: 'Route not found' });
    res.status(200).json({ message: 'Route updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating Route', error: error.message });
  }
};

exports.deactivateRoute = async (req, res) => {
  try {
    const { id } = req.params;
    const deactivated = await Route.update({ isActive: false }, { where: { id } });
    if (deactivated[0] === 0) return res.status(404).json({ message: 'Route not found' });
    res.status(200).json({ message: 'Route deactivated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deactivating Route', error: error.message });
  }
};