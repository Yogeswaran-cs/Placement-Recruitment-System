const Student = require('../models/Student');
const Application = require('../models/Application');
const Company = require('../models/Company');
const { ok } = require('../utils/response');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Get placement analytics dashboard stats
// @route   GET /api/stats
// @access  Private
const getStats = asyncHandler(async (req, res) => {
  // 1. General Placement Analysis (q15)
  const totalStudents = await Student.countDocuments({});
  // Match 'PLACED' case-insensitively or directly
  const placedStudents = await Student.countDocuments({ 
    status: { $regex: /^placed$/i } 
  });
  
  // Any student who is not PLACED is considered unplaced
  const unplacedStudents = totalStudents - placedStudents;
  const placementRate = totalStudents > 0 ? ((placedStudents / totalStudents) * 100).toFixed(1) : '0.0';

  const placementAnalysis = {
    totalStudents,
    placedStudents,
    unplacedStudents,
    placementRate: parseFloat(placementRate)
  };

  // 2. Department Analytics (q16)
  const departmentAnalytics = await Student.aggregate([
    {
      $group: {
        _id: '$department',
        total: { $sum: 1 },
        placed: {
          $sum: { 
            $cond: [
              { $regexMatch: { input: '$status', regex: /^placed$/i } }, 
              1, 
              0
            ] 
          }
        },
        unplaced: {
          $sum: { 
            $cond: [
              { $not: { $regexMatch: { input: '$status', regex: /^placed$/i } } }, 
              1, 
              0
            ] 
          }
        }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // 3. Company Analytics (q17)
  const companyAnalytics = await Application.aggregate([
    {
      $lookup: {
        from: 'drives',
        localField: 'driveId',
        foreignField: 'driveId',
        as: 'driveInfo'
      }
    },
    { $unwind: { path: '$driveInfo', preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: 'companies',
        localField: 'driveInfo.companyId',
        foreignField: 'companyId',
        as: 'companyInfo'
      }
    },
    { $unwind: { path: '$companyInfo', preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: { $ifNull: ['$companyInfo.name', '$driveId'] },
        companyId: { $first: '$driveInfo.companyId' },
        applicationsCount: { $sum: 1 },
        selectedCount: {
          $sum: { 
            $cond: [
              { $regexMatch: { input: '$status', regex: /^selected$/i } }, 
              1, 
              0
            ] 
          }
        },
        shortlistedCount: {
          $sum: { 
            $cond: [
              { $regexMatch: { input: '$status', regex: /^shortlisted$/i } }, 
              1, 
              0
            ] 
          }
        }
      }
    },
    { $sort: { applicationsCount: -1 } }
  ]);

  return ok(res, {
    placementAnalysis,
    departmentAnalytics,
    companyAnalytics
  }, 'Analytics stats calculated successfully');
});

module.exports = {
  getStats
};
