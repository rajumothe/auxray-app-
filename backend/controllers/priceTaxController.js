const { PriceMaster, TaxMaster, SKU, Company, Plant, SalesOffice, Route } = require('../models');

// --- PRICE MASTER HANDLERS ---
exports.createPriceRule = async (req, res) => {
  try {
    const { skuId, price, effectiveFrom, effectiveTo, companyId, plantId, salesOfficeId, routeId, customerId } = req.body;
    
    const newPrice = await PriceMaster.create({
      skuId, price, effectiveFrom, effectiveTo: effectiveTo || null,
      companyId: companyId || null, plantId: plantId || null,
      salesOfficeId: salesOfficeId || null, routeId: routeId || null, customerId: customerId || null
    });
    
    res.status(201).json({ message: 'Hierarchical pricing rule created successfully', data: newPrice });
  } catch (error) {
    res.status(500).json({ message: 'Error establishing pricing master entry', error: error.message });
  }
};

exports.getAllPrices = async (req, res) => {
  try {
    const prices = await PriceMaster.findAll({
      where: { isActive: true },
      include: [
        { model: SKU, attributes: ['itemName', 'itemCode', 'uom'] },
        { model: Company, attributes: ['companyName'] },
        { model: Plant, attributes: ['plantName'] },
        { model: SalesOffice, attributes: ['officeName'] },
        { model: Route, attributes: ['routeName'] }
      ]
    });
    res.status(200).json({ data: prices });
  } catch (error) {
    console.error('Database query failed:', error); // Prints exact error in backend console terminal
    res.status(500).json({ message: 'Error reading price definitions', error: error.message });
  }
};

// --- TAX MASTER HANDLERS ---
exports.createTaxRule = async (req, res) => {
  try {
    const { skuId, state, cgstRate, sgstRate, igstRate, hsnCode } = req.body;
    
    const newTax = await TaxMaster.create({ skuId, state, cgstRate, sgstRate, igstRate, hsnCode });
    res.status(201).json({ message: 'State tax matrix rule saved', data: newTax });
  } catch (error) {
    res.status(500).json({ message: 'Error saving tax parameters', error: error.message });
  }
};

exports.getAllTaxes = async (req, res) => {
  try {
    const taxes = await TaxMaster.findAll({
      where: { isActive: true },
      include: [{ model: SKU, attributes: ['itemName', 'itemCode'] }]
    });
    res.status(200).json({ data: taxes });
  } catch (error) {
    res.status(500).json({ message: 'Error pulling statutory tax matrices', error: error.message });
  }
};