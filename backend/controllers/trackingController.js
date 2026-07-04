const { TrackingLog, TrackingPoint, Attendance } = require('../models');
const sequelize = require('../config/database');

// Core company allowance configuration constants
const TA_RATE_PER_KM = 7.00; // Travel Allowance per Kilometer
const FLAT_DAILY_ALLOWANCE = 250.00; // Daily Allowance fallback flat-rate

exports.checkIn = async (req, res) => {
  try {
    const employeeId = req.user.id; // Extracted dynamically from your verifyToken middleware
    const { latitude, longitude } = req.body || {};
    const todayDate = new Date().toISOString().slice(0, 10);

    // Prevent duplicate Active Check-Ins
    const activeSession = await TrackingLog.findOne({
      where: { employeeId, status: 'ACTIVE' }
    });

    if (activeSession) {
      return res.status(400).json({ message: 'You have an active tracking session running. Please check out first.' });
    }

    const newSession = await TrackingLog.create({
      employeeId,
      checkInTime: new Date(),
      checkInLat: latitude ?? null,
      checkInLng: longitude ?? null,
      totalDistanceKm: 0.00,
      taAmount: 0.00,
      daAmount: 0.00,
      status: 'ACTIVE'
    });

    const existingAttendance = await Attendance.findOne({
      where: { employeeId, date: todayDate },
      order: [['createdAt', 'DESC']],
    });

    if (!existingAttendance) {
      await Attendance.create({
        employeeId,
        date: todayDate,
        checkInTime: newSession.checkInTime,
        checkInLat: latitude ?? null,
        checkInLng: longitude ?? null,
        totalKmsTraveled: 0,
      });
    } else if (!existingAttendance.checkOutTime) {
      await existingAttendance.update({
        checkInTime: existingAttendance.checkInTime || newSession.checkInTime,
        checkInLat: existingAttendance.checkInLat ?? latitude ?? null,
        checkInLng: existingAttendance.checkInLng ?? longitude ?? null,
      });
    }

    if (latitude !== null && latitude !== undefined && longitude !== null && longitude !== undefined) {
      await TrackingPoint.create({
        trackingLogId: newSession.id,
        employeeId,
        latitude,
        longitude,
        recordedAt: new Date(),
      });
    }

    res.status(201).json({ message: 'Check-In initialized successfully. Tracking started.', data: newSession });
  } catch (error) {
    res.status(500).json({ message: 'Error initializing attendance session', error: error.message });
  }
};

exports.syncGpsBatch = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const { incrementalKm, latitude, longitude, recordedAt } = req.body; // Distance computed locally by device GPS between batch ticks

    const activeSession = await TrackingLog.findOne({
      where: { employeeId, status: 'ACTIVE' }
    });

    if (!activeSession) {
      return res.status(404).json({ message: 'No active session found to push location coordinates.' });
    }

    // Natively increment running distance inside the database row safely
    const updatedDistance = parseFloat(activeSession.totalDistanceKm) + parseFloat(incrementalKm || 0);
    
    await TrackingLog.update(
      { totalDistanceKm: updatedDistance },
      { where: { id: activeSession.id } }
    );

    const todayDate = new Date().toISOString().slice(0, 10);
    const attendance = await Attendance.findOne({
      where: { employeeId, date: todayDate },
      order: [['createdAt', 'DESC']],
    });

    if (attendance && !attendance.checkOutTime) {
      await attendance.update({ totalKmsTraveled: updatedDistance });
    }

    if (latitude !== null && latitude !== undefined && longitude !== null && longitude !== undefined) {
      await TrackingPoint.create({
        trackingLogId: activeSession.id,
        employeeId,
        latitude,
        longitude,
        recordedAt: recordedAt ? new Date(recordedAt) : new Date(),
      });
    }

    res.status(200).json({ message: 'Batch location telemetry aggregated successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error processing batch location sync tracking vectors', error: error.message });
  }
};

exports.checkOut = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const employeeId = req.user.id;
    const { latitude, longitude } = req.body || {};
    const todayDate = new Date().toISOString().slice(0, 10);

    const activeSession = await TrackingLog.findOne({
      where: { employeeId, status: 'ACTIVE' },
      transaction: t
    });

    if (!activeSession) {
      await t.rollback();
      return res.status(404).json({ message: 'No active tracking sessions found for this user context.' });
    }

    const finalDistance = parseFloat(activeSession.totalDistanceKm);
    
    // Calculate Allowance Matrix algorithms
    const computedTA = finalDistance * TA_RATE_PER_KM;
    const computedDA = finalDistance > 5 ? FLAT_DAILY_ALLOWANCE : 0.00; // Only grant DA if field execution target exceeds 5KM threshold

    await TrackingLog.update({
      checkOutTime: new Date(),
      checkOutLat: latitude ?? null,
      checkOutLng: longitude ?? null,
      taAmount: computedTA,
      daAmount: computedDA,
      status: 'COMPLETED'
    }, {
      where: { id: activeSession.id },
      transaction: t
    });

    const openAttendance = await Attendance.findOne({
      where: { employeeId, date: todayDate, checkOutTime: null },
      order: [['createdAt', 'DESC']],
      transaction: t,
    });

    if (openAttendance) {
      const checkOutTime = new Date();
      const totalWorkHours = Number(((checkOutTime.getTime() - new Date(openAttendance.checkInTime).getTime()) / (1000 * 60 * 60)).toFixed(2));
      await openAttendance.update({
        checkOutTime,
        checkOutLat: latitude ?? null,
        checkOutLng: longitude ?? null,
        totalWorkHours,
        totalKmsTraveled: finalDistance,
      }, { transaction: t });
    }

    if (latitude !== null && latitude !== undefined && longitude !== null && longitude !== undefined) {
      await TrackingPoint.create({
        trackingLogId: activeSession.id,
        employeeId,
        latitude,
        longitude,
        recordedAt: new Date(),
      }, { transaction: t });
    }

    await t.commit();
    res.status(200).json({
      message: 'Check-Out processed successfully. Session completed.',
      summary: {
        totalDistanceKm: finalDistance,
        travelAllowanceInr: computedTA,
        dailyAllowanceInr: computedDA,
        totalClaimGeneratedInr: computedTA + computedDA
      }
    });
  } catch (error) {
    await t.rollback();
    res.status(500).json({ message: 'Error closing tracking metrics session', error: error.message });
  }
};