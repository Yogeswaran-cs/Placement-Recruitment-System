const mongoose = require('mongoose');
const Student = require('../models/Student');
const Company = require('../models/Company');
const Drive = require('../models/Drive');
const Application = require('../models/Application');
const User = require('../models/User');
const { ok } = require('../utils/response');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Get health status of API & Database connection
// @route   GET /api/health
// @access  Public
const getHealth = asyncHandler(async (req, res) => {
  const isConnected = mongoose.connection.readyState === 1;
  const status = isConnected ? 'connected' : 'disconnected';

  let documentCount = 0;
  if (isConnected) {
    const studentCount = await Student.countDocuments({});
    const companyCount = await Company.countDocuments({});
    const driveCount = await Drive.countDocuments({});
    const appCount = await Application.countDocuments({});
    const userCount = await User.countDocuments({});
    
    documentCount = studentCount + companyCount + driveCount + appCount + userCount;
  }

  // Exact response structure: { success: true, database: "connected", documentCount: N }
  return res.status(200).json({
    success: true,
    database: status,
    documentCount
  });
});

module.exports = {
  getHealth
};
