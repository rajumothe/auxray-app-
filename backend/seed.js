const ensureEmployeeSalesOfficeMapping = async (EmployeeSalesOffice, employeeId, salesOfficeId) => {
  const existing = await EmployeeSalesOffice.findOne({ where: { employeeId, salesOfficeId } });
  if (!existing) {
    await EmployeeSalesOffice.create({ employeeId, salesOfficeId });
  }
};

const ensureEmployeeRouteMapping = async (EmployeeRoute, employeeId, routeId) => {
  const existing = await EmployeeRoute.findOne({ where: { employeeId, routeId } });
  if (!existing) {
    await EmployeeRoute.create({ employeeId, routeId });
  }
};

const seedInitialData = async () => {
  const {
    Employee,
    Company,
    Plant,
    SalesOffice,
    Route,
    Customer,
    Lead,
    LeadExtension,
    Visit,
    ServiceTicket,
    TrackingLog,
    MaterialType,
    SKU,
    PriceMaster,
    TaxMaster,
    EmployeeSalesOffice,
    EmployeeRoute,
  } = require('./models');

  try {
    let defaultCompany = await Company.findOne({ where: { companyCode: 1000 } });

    if (!defaultCompany) {
      defaultCompany = await Company.create({
        companyName: 'Auxray Energy Default Node',
        stateCode: 'TS',
        gstNumber: '36AAAAA0000A1Z5',
        panNumber: 'AAAAA0000A',
        state: 'Telangana',
        fullAddress: 'Corporate Grid Headquarters, Hyderabad',
        isActive: true,
      });
      console.log('Baseline company seeded.');
    }

    let admin = await Employee.findOne({ where: { role: 'HOD', companyId: defaultCompany.id } });
    if (!admin) {
      admin = await Employee.create({
        fullName: 'System Administrator',
        email: 'hod@auxray.local',
        mobileNumber: '9000000001',
        alternateNumber: '9000000011',
        address: 'Auxray HQ, Hyderabad',
        password: 'password123',
        role: 'HOD',
        companyId: defaultCompany.id,
        isActive: true,
      });
      console.log('Default HOD seeded.');
    }

    const plantSeeds = [
      {
        plantCode: 'PLT-HYD',
        plantName: 'Hyderabad Central Plant',
        address: 'Jeedimetla Industrial Area, Hyderabad',
        state: 'Telangana',
        gstNumber: '36AUXRY0001P1Z5',
      },
      {
        plantCode: 'PLT-VZG',
        plantName: 'Visakhapatnam Coastal Plant',
        address: 'Gajuwaka Industrial Belt, Visakhapatnam',
        state: 'Andhra Pradesh',
        gstNumber: '37AUXRY0002P1Z4',
      },
    ];

    const plantsByCode = {};
    for (const plantSeed of plantSeeds) {
      const [plant] = await Plant.findOrCreate({
        where: { plantCode: plantSeed.plantCode },
        defaults: {
          ...plantSeed,
          companyId: defaultCompany.id,
          isActive: true,
        },
      });
      plantsByCode[plantSeed.plantCode] = plant;
    }

    const salesOfficeSeeds = [
      {
        officeCode: 'SO-HYD-N',
        officeName: 'Hyderabad North Office',
        fullAddress: 'Kukatpally, Hyderabad',
        plantCode: 'PLT-HYD',
      },
      {
        officeCode: 'SO-HYD-S',
        officeName: 'Hyderabad South Office',
        fullAddress: 'LB Nagar, Hyderabad',
        plantCode: 'PLT-HYD',
      },
      {
        officeCode: 'SO-VZG-C',
        officeName: 'Vizag City Office',
        fullAddress: 'Dwaraka Nagar, Visakhapatnam',
        plantCode: 'PLT-VZG',
      },
    ];

    const salesOfficesByCode = {};
    for (const officeSeed of salesOfficeSeeds) {
      const plant = plantsByCode[officeSeed.plantCode];
      if (!plant) continue;

      const [salesOffice] = await SalesOffice.findOrCreate({
        where: { officeCode: officeSeed.officeCode },
        defaults: {
          officeName: officeSeed.officeName,
          officeCode: officeSeed.officeCode,
          fullAddress: officeSeed.fullAddress,
          plantId: plant.id,
          isActive: true,
        },
      });
      salesOfficesByCode[officeSeed.officeCode] = salesOffice;
    }

    const routeSeeds = [
      {
        serialNumber: 'RT-1001',
        routeCode: 'R-HYD-KKP',
        routeName: 'Kukatpally Corridor',
        officeCode: 'SO-HYD-N',
      },
      {
        serialNumber: 'RT-1002',
        routeCode: 'R-HYD-MDH',
        routeName: 'Madhapur Belt',
        officeCode: 'SO-HYD-N',
      },
      {
        serialNumber: 'RT-1003',
        routeCode: 'R-HYD-LBN',
        routeName: 'LB Nagar Zone',
        officeCode: 'SO-HYD-S',
      },
      {
        serialNumber: 'RT-1004',
        routeCode: 'R-VZG-DWK',
        routeName: 'Dwaraka Core',
        officeCode: 'SO-VZG-C',
      },
    ];

    const routesByCode = {};
    for (const routeSeed of routeSeeds) {
      const office = salesOfficesByCode[routeSeed.officeCode];
      if (!office) continue;

      const [route] = await Route.findOrCreate({
        where: { routeCode: routeSeed.routeCode },
        defaults: {
          serialNumber: routeSeed.serialNumber,
          routeName: routeSeed.routeName,
          routeCode: routeSeed.routeCode,
          salesOfficeId: office.id,
          isActive: true,
        },
      });
      routesByCode[routeSeed.routeCode] = route;
    }

    const materialTypeSeeds = [
      { shortCode: 'ELEC', description: 'Electrical Components' },
      { shortCode: 'MOUN', description: 'Module Mounting Hardware' },
      { shortCode: 'CABL', description: 'Cables and Connectors' },
    ];

    const materialTypesByCode = {};
    for (const seed of materialTypeSeeds) {
      const [materialType] = await MaterialType.findOrCreate({
        where: { shortCode: seed.shortCode },
        defaults: seed,
      });
      materialTypesByCode[seed.shortCode] = materialType;
    }

    const skuSeeds = [
      { itemName: 'Mono PERC Panel 545W', uom: 'PC', materialTypeCode: 'ELEC' },
      { itemName: 'String Inverter 50kW', uom: 'PC', materialTypeCode: 'ELEC' },
      { itemName: 'Hot Dip GI Rail Set', uom: 'Sets', materialTypeCode: 'MOUN' },
      { itemName: 'DC Solar Cable 4 sq.mm', uom: 'Mtrs', materialTypeCode: 'CABL' },
    ];

    const skusByName = {};
    for (const seed of skuSeeds) {
      const materialType = materialTypesByCode[seed.materialTypeCode];
      if (!materialType) continue;

      const [sku] = await SKU.findOrCreate({
        where: { itemName: seed.itemName },
        defaults: {
          itemName: seed.itemName,
          uom: seed.uom,
          materialTypeId: materialType.id,
          isActive: true,
        },
      });
      skusByName[seed.itemName] = sku;
    }

    const today = new Date().toISOString().slice(0, 10);
    const priceSeeds = [
      { itemName: 'Mono PERC Panel 545W', price: 11999.0, effectiveFrom: today, companyId: defaultCompany.id },
      {
        itemName: 'String Inverter 50kW',
        price: 214500.0,
        effectiveFrom: today,
        companyId: defaultCompany.id,
        plantId: plantsByCode['PLT-HYD']?.id || null,
      },
      {
        itemName: 'Hot Dip GI Rail Set',
        price: 2450.0,
        effectiveFrom: today,
        companyId: defaultCompany.id,
        plantId: plantsByCode['PLT-HYD']?.id || null,
        salesOfficeId: salesOfficesByCode['SO-HYD-N']?.id || null,
      },
      {
        itemName: 'DC Solar Cable 4 sq.mm',
        price: 78.5,
        effectiveFrom: today,
        companyId: defaultCompany.id,
        plantId: plantsByCode['PLT-VZG']?.id || null,
        salesOfficeId: salesOfficesByCode['SO-VZG-C']?.id || null,
        routeId: routesByCode['R-VZG-DWK']?.id || null,
      },
    ];

    for (const seed of priceSeeds) {
      const sku = skusByName[seed.itemName];
      if (!sku) continue;

      const where = {
        skuId: sku.id,
        effectiveFrom: seed.effectiveFrom,
        companyId: seed.companyId || null,
        plantId: seed.plantId || null,
        salesOfficeId: seed.salesOfficeId || null,
        routeId: seed.routeId || null,
        customerId: null,
      };

      const existing = await PriceMaster.findOne({ where });
      if (!existing) {
        await PriceMaster.create({ ...where, price: seed.price, effectiveTo: null, isActive: true });
      }
    }

    const taxSeeds = [
      {
        itemName: 'Mono PERC Panel 545W',
        state: 'Telangana',
        cgstRate: 6.0,
        sgstRate: 6.0,
        igstRate: 12.0,
        hsnCode: '85414300',
      },
      {
        itemName: 'String Inverter 50kW',
        state: 'Andhra Pradesh',
        cgstRate: 9.0,
        sgstRate: 9.0,
        igstRate: 18.0,
        hsnCode: '85044090',
      },
      {
        itemName: 'Hot Dip GI Rail Set',
        state: 'Telangana',
        cgstRate: 9.0,
        sgstRate: 9.0,
        igstRate: 18.0,
        hsnCode: '73089090',
      },
      {
        itemName: 'DC Solar Cable 4 sq.mm',
        state: 'Andhra Pradesh',
        cgstRate: 9.0,
        sgstRate: 9.0,
        igstRate: 18.0,
        hsnCode: '85444999',
      },
    ];

    for (const seed of taxSeeds) {
      const sku = skusByName[seed.itemName];
      if (!sku) continue;

      const [tax] = await TaxMaster.findOrCreate({
        where: { skuId: sku.id, state: seed.state },
        defaults: {
          skuId: sku.id,
          state: seed.state,
          cgstRate: seed.cgstRate,
          sgstRate: seed.sgstRate,
          igstRate: seed.igstRate,
          hsnCode: seed.hsnCode,
          isActive: true,
        },
      });

      if (!tax.isActive) {
        await tax.update({ isActive: true });
      }
    }

    const ensureEmployee = async (seed, managerId = null) => {
      let employee = await Employee.findOne({
        where: {
          companyId: defaultCompany.id,
          email: seed.email,
        },
      });

      if (!employee) {
        employee = await Employee.create({
          fullName: seed.fullName,
          email: seed.email,
          mobileNumber: seed.mobileNumber,
          alternateNumber: seed.alternateNumber || null,
          address: seed.address || null,
          password: seed.password || 'password123',
          role: seed.role,
          companyId: defaultCompany.id,
          managerId,
          isActive: true,
        });
      } else {
        const updates = {
          fullName: seed.fullName,
          mobileNumber: seed.mobileNumber,
          alternateNumber: seed.alternateNumber || employee.alternateNumber,
          address: seed.address || employee.address,
          role: seed.role,
          managerId,
          isActive: true,
        };

        Object.assign(employee, updates);

        if (!employee.password || !(await employee.isValidPassword(seed.password || 'password123'))) {
          employee.password = seed.password || 'password123';
        }

        await employee.save();
      }

      return employee;
    };

    // Required org shape:
    // 1 HOD, 1 SH, 1 RSM, 1 Back Office, 2 ASM, 2 Executive, 2 Technician
    const hod = await ensureEmployee(
      {
        fullName: 'Core HOD User',
        role: 'HOD',
        email: 'hod@auxray.local',
        mobileNumber: '9101000001',
        alternateNumber: '9101000011',
        address: 'Auxray HQ',
        password: 'password123',
      },
      null
    );

    const sh = await ensureEmployee(
      {
        fullName: 'Core State Head User',
        role: 'State Head',
        email: 'sh@auxray.local',
        mobileNumber: '9101000002',
        alternateNumber: '9101000012',
        address: 'State Office',
        password: 'password123',
      },
      hod.id
    );

    const rsm = await ensureEmployee(
      {
        fullName: 'Core RSM User',
        role: 'RSM',
        email: 'rsm@auxray.local',
        mobileNumber: '9101000003',
        alternateNumber: '9101000013',
        address: 'Regional Office',
        password: 'password123',
      },
      sh.id
    );

    const backOffice = await ensureEmployee(
      {
        fullName: 'Core Back Office User',
        role: 'Back Office',
        email: 'bo@auxray.local',
        mobileNumber: '9101000004',
        alternateNumber: '9101000014',
        address: 'Back Office Desk',
        password: 'password123',
      },
      hod.id
    );

    const asmOne = await ensureEmployee(
      {
        fullName: 'Core ASM One',
        role: 'ASM',
        email: 'asm1@auxray.local',
        mobileNumber: '9101000005',
        alternateNumber: '9101000015',
        address: 'ASM Zone 1',
        password: 'password123',
      },
      rsm.id
    );

    const asmTwo = await ensureEmployee(
      {
        fullName: 'Core ASM Two',
        role: 'ASM',
        email: 'asm2@auxray.local',
        mobileNumber: '9101000006',
        alternateNumber: '9101000016',
        address: 'ASM Zone 2',
        password: 'password123',
      },
      rsm.id
    );

    const execOne = await ensureEmployee(
      {
        fullName: 'Core Executive One',
        role: 'Executive',
        email: 'exec1@auxray.local',
        mobileNumber: '9101000007',
        alternateNumber: '9101000017',
        address: 'Executive Zone 1',
        password: 'password123',
      },
      asmOne.id
    );

    const execTwo = await ensureEmployee(
      {
        fullName: 'Core Executive Two',
        role: 'Executive',
        email: 'exec2@auxray.local',
        mobileNumber: '9101000008',
        alternateNumber: '9101000018',
        address: 'Executive Zone 2',
        password: 'password123',
      },
      asmTwo.id
    );

    const techOne = await ensureEmployee(
      {
        fullName: 'Core Technician One',
        role: 'Technician',
        email: 'tech1@auxray.local',
        mobileNumber: '9101000009',
        alternateNumber: '9101000019',
        address: 'Tech Zone 1',
        password: 'password123',
      },
      asmOne.id
    );

    const techTwo = await ensureEmployee(
      {
        fullName: 'Core Technician Two',
        role: 'Technician',
        email: 'tech2@auxray.local',
        mobileNumber: '9101000010',
        alternateNumber: '9101000020',
        address: 'Tech Zone 2',
        password: 'password123',
      },
      asmTwo.id
    );

    const selectedEmployeeIds = [
      hod.id,
      sh.id,
      rsm.id,
      backOffice.id,
      asmOne.id,
      asmTwo.id,
      execOne.id,
      execTwo.id,
      techOne.id,
      techTwo.id,
    ];

    await Employee.update(
      { isActive: false },
      {
        where: {
          companyId: defaultCompany.id,
          id: { [require('sequelize').Op.notIn]: selectedEmployeeIds },
        },
        validate: false,
        hooks: false,
      }
    );

    await Employee.update(
      { isActive: true },
      {
        where: {
          companyId: defaultCompany.id,
          id: selectedEmployeeIds,
        },
        validate: false,
        hooks: false,
      }
    );

    const officeMap = {
      'SO-HYD-N': salesOfficesByCode['SO-HYD-N'],
      'SO-HYD-S': salesOfficesByCode['SO-HYD-S'],
      'SO-VZG-C': salesOfficesByCode['SO-VZG-C'],
    };

    const routeMap = {
      'R-HYD-KKP': routesByCode['R-HYD-KKP'],
      'R-HYD-MDH': routesByCode['R-HYD-MDH'],
      'R-HYD-LBN': routesByCode['R-HYD-LBN'],
      'R-VZG-DWK': routesByCode['R-VZG-DWK'],
    };

    const salesOfficeAssignments = [
      [sh, ['SO-HYD-N', 'SO-HYD-S']],
      [rsm, ['SO-HYD-N', 'SO-HYD-S']],
      [asmOne, ['SO-HYD-N']],
      [asmTwo, ['SO-HYD-S']],
    ];

    for (const [employee, officeCodes] of salesOfficeAssignments) {
      for (const officeCode of officeCodes) {
        const office = officeMap[officeCode];
        if (employee && office) {
          await ensureEmployeeSalesOfficeMapping(EmployeeSalesOffice, employee.id, office.id);
        }
      }
    }

    const routeAssignments = [
      [execOne, ['R-HYD-KKP']],
      [execTwo, ['R-HYD-MDH']],
      [techOne, ['R-HYD-KKP']],
      [techTwo, ['R-HYD-MDH']],
    ];

    for (const [employee, routeCodes] of routeAssignments) {
      for (const routeCode of routeCodes) {
        const route = routeMap[routeCode];
        if (employee && route) {
          await ensureEmployeeRouteMapping(EmployeeRoute, employee.id, route.id);
        }
      }
    }

    const customerSeeds = [
      {
        customerName: 'Venkatesh Enterprises',
        contactNumber: '9440123456',
        latitude: 17.4485,
        longitude: 78.3748,
        routeCode: 'R-HYD-KKP',
      },
      {
        customerName: 'Megha Solar Farms Ltd',
        contactNumber: '9177654321',
        latitude: 17.4412,
        longitude: 78.3811,
        routeCode: 'R-HYD-MDH',
      },
      {
        customerName: 'Dr. Ramana Rao Residence',
        contactNumber: '9848022334',
        latitude: 17.4621,
        longitude: 78.3594,
        routeCode: 'R-VZG-DWK',
      },
    ];

    const customersByName = {};
    for (const seed of customerSeeds) {
      const route = routesByCode[seed.routeCode];
      if (!route) continue;

      let customer = await Customer.findOne({
        where: { customerName: seed.customerName, contactNumber: seed.contactNumber, routeId: route.id },
      });

      if (!customer) {
        customer = await Customer.create({
          customerName: seed.customerName,
          contactNumber: seed.contactNumber,
          latitude: seed.latitude,
          longitude: seed.longitude,
          routeId: route.id,
          isActive: true,
        });
      }

      customersByName[seed.customerName] = customer;
    }

    const now = new Date();
    const todayDate = now.toISOString().slice(0, 10);
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayDate = yesterday.toISOString().slice(0, 10);

    const leadSeeds = [];
    for (let i = 1; i <= 10; i++) {
      leadSeeds.push({
        leadName: `ExecOne Lead ${String(i).padStart(2, '0')}`,
        contactNumber: `9102100${String(i).padStart(3, '0')}`,
        address: `Hitech City Block ${i}, Hyderabad`,
        latitude: 17.4485 + i * 0.0001,
        longitude: 78.3748 + i * 0.0001,
        status: 'Pending KYC Submission',
        routeCode: 'R-HYD-KKP',
        createdById: execOne.id,
      });
      leadSeeds.push({
        leadName: `ExecTwo Lead ${String(i).padStart(2, '0')}`,
        contactNumber: `9102200${String(i).padStart(3, '0')}`,
        address: `Madhapur Sector ${i}, Hyderabad`,
        latitude: 17.4412 + i * 0.0001,
        longitude: 78.3811 + i * 0.0001,
        status: 'Pending KYC Submission',
        routeCode: 'R-HYD-MDH',
        createdById: execTwo.id,
      });
    }

    const leadsByName = {};
    for (const seed of leadSeeds) {
      const route = routesByCode[seed.routeCode];
      if (!route) continue;

      let lead = await Lead.findOne({
        where: { leadName: seed.leadName, contactNumber: seed.contactNumber, createdById: seed.createdById, routeId: route.id },
      });

      if (!lead) {
        lead = await Lead.create({
          leadName: seed.leadName,
          contactNumber: seed.contactNumber,
          address: seed.address,
          latitude: seed.latitude,
          longitude: seed.longitude,
          status: seed.status,
          routeId: route.id,
          createdById: seed.createdById,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        });

        await LeadExtension.findOrCreate({
          where: { leadId: lead.id },
          defaults: {
            leadId: lead.id,
            unitCapacitySelection: 'Mono PERC Panel 545W',
            stage: 'LEAD_CREATED',
          },
        });
      } else {
        await LeadExtension.findOrCreate({
          where: { leadId: lead.id },
          defaults: {
            leadId: lead.id,
            unitCapacitySelection: 'Mono PERC Panel 545W',
            stage: 'LEAD_CREATED',
          },
        });
      }

      leadsByName[seed.leadName] = lead;
    }

    const ensureVisit = async (visitSeed) => {
      const existing = await Visit.findOne({
        where: {
          employeeId: visitSeed.employeeId,
          leadId: visitSeed.leadId,
          customerId: visitSeed.customerId,
          visitDate: visitSeed.visitDate,
          purpose: visitSeed.purpose,
        },
      });

      if (!existing) {
        await Visit.create({ ...visitSeed });
      }
    };

    await ensureVisit({
      employeeId: execOne.id,
      leadId: leadsByName['ExecOne Lead 01']?.id || null,
      customerId: customersByName['Venkatesh Enterprises']?.id || null,
      visitDate: todayDate,
      checkInTime: now,
      checkOutTime: now,
      visitLat: 17.4485,
      visitLng: 78.3748,
      purpose: 'Sales Pitch',
      remarks: 'Initial visit for seeded lead',
      createdAt: now,
      updatedAt: now,
    });

    await ensureVisit({
      employeeId: execTwo.id,
      leadId: leadsByName['ExecTwo Lead 01']?.id || null,
      customerId: customersByName['Megha Solar Farms Ltd']?.id || null,
      visitDate: yesterdayDate,
      checkInTime: yesterday,
      checkOutTime: yesterday,
      visitLat: 17.4412,
      visitLng: 78.3811,
      purpose: 'Follow-up',
      remarks: 'Seeded second executive visit',
      createdAt: yesterday,
      updatedAt: yesterday,
    });

    const activeTracking = await TrackingLog.findOne({ where: { employeeId: execOne.id, status: 'ACTIVE' } });
    if (!activeTracking) {
      await TrackingLog.create({
        employeeId: execOne.id,
        checkInTime: now,
        totalDistanceKm: 12.5,
        taAmount: 175.0,
        daAmount: 200.0,
        status: 'ACTIVE',
      });
    }

    const completedTracking = await TrackingLog.findOne({ where: { employeeId: execTwo.id, status: 'COMPLETED' } });
    if (!completedTracking) {
      await TrackingLog.create({
        employeeId: execTwo.id,
        checkInTime: yesterday,
        checkOutTime: now,
        totalDistanceKm: 36.2,
        taAmount: 420.0,
        daAmount: 300.0,
        status: 'COMPLETED',
      });
    }

    const serviceTicketSeeds = [
      {
        customerName: 'Venkatesh Enterprises',
        raisedById: execOne.id,
        technicianId: techOne.id,
        pinCode: '500072',
        issueDescription: 'Inverter trips during peak load',
        status: 'ASSIGNED',
      },
      {
        customerName: 'Megha Solar Farms Ltd',
        raisedById: execOne.id,
        technicianId: techOne.id,
        pinCode: '500081',
        issueDescription: 'Panel generation drop in string B',
        status: 'FRESH',
      },
      {
        customerName: 'Dr. Ramana Rao Residence',
        raisedById: execTwo.id,
        technicianId: techTwo.id,
        pinCode: '530016',
        issueDescription: 'Wi-Fi monitoring offline',
        status: 'RESOLVED',
      },
    ];

    for (const seed of serviceTicketSeeds) {
      const customer = customersByName[seed.customerName];
      if (!customer) continue;

      const existing = await ServiceTicket.findOne({
        where: {
          customerId: customer.id,
          raisedById: seed.raisedById,
          issueDescription: seed.issueDescription,
        },
      });

      if (!existing) {
        await ServiceTicket.create({
          customerId: customer.id,
          raisedById: seed.raisedById,
          technicianId: seed.technicianId,
          pinCode: seed.pinCode,
          issueDescription: seed.issueDescription,
          status: seed.status,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    const testLogins = [
      { role: 'HOD', employee: hod },
      { role: 'State Head', employee: sh },
      { role: 'RSM', employee: rsm },
      { role: 'Back Office', employee: backOffice },
      { role: 'ASM-1', employee: asmOne },
      { role: 'ASM-2', employee: asmTwo },
      { role: 'Executive-1', employee: execOne },
      { role: 'Executive-2', employee: execTwo },
      { role: 'Technician-1', employee: techOne },
      { role: 'Technician-2', employee: techTwo },
    ];

    console.log('Dummy seed completed with strict org profile and 20 leads (10 per executive).');
    console.log('Test users for workflow validation (password: password123):');
    testLogins.forEach((x) => {
      console.log(`  - ${x.role}: ${x.employee?.empId} | ${x.employee?.email}`);
    });
  } catch (error) {
    console.error('Seed failure:', error);
  }
};

module.exports = seedInitialData;