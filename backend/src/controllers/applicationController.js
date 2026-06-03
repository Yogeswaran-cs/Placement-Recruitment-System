const Application = require('../models/Application');
const Student = require('../models/Student');
const Drive = require('../models/Drive');
const Company = require('../models/Company');
const { ok, fail } = require('../utils/response');
const asyncHandler = require('../middleware/asyncHandler');

// Helper to generate application ID
const generateApplicationId = () => {
  return `APP${Math.floor(1000 + Math.random() * 9000)}`;
};

// @desc    Apply for a placement drive
// @route   POST /api/applications
// @access  Private
const applyForDrive = asyncHandler(async (req, res) => {
  const { studentId, driveId } = req.body;

  let finalStudentId = studentId;
  
  // If user is a student, enforce applying as themselves
  if (req.user && req.user.role === 'STUDENT') {
    if (!req.user.studentId) {
      return fail(res, 400, 'Your user profile is not linked to any student record');
    }
    finalStudentId = req.user.studentId;
  }

  if (!finalStudentId || !driveId) {
    return fail(res, 400, 'Student ID and Drive ID are required');
  }

  // 1. Find Student
  const studentRecord = await Student.findOne({ studentId: finalStudentId });
  if (!studentRecord) {
    return fail(res, 404, `Student record not found for: ${finalStudentId}`);
  }

  // 2. Find Drive
  const driveRecord = await Drive.findOne({ driveId });
  if (!driveRecord) {
    return fail(res, 404, `Placement drive not found with ID ${driveId}`);
  }

  // 3. Find Company
  const companyRecord = await Company.findOne({ companyId: driveRecord.companyId });
  if (!companyRecord) {
    return fail(res, 500, `Company data missing for this drive`);
  }

  // 4. Workflow Rule: Closed drives cannot accept applications
  if (driveRecord.status.toLowerCase() === 'closed') {
    return fail(res, 400, `This placement drive is closed and cannot accept new applications`);
  }

  // 5. Workflow Rule: Student CGPA must satisfy company minimum CGPA
  if (studentRecord.cgpa < companyRecord.minimumCgpa) {
    return fail(res, 400, `Application rejected: Your CGPA (${studentRecord.cgpa}) does not meet the minimum CGPA requirement (${companyRecord.minimumCgpa}) for ${companyRecord.name}`);
  }

  // 6. Workflow Rule: Student department must be eligible
  const isDeptEligible = companyRecord.eligibleDepartments.some(
    dept => dept.trim().toUpperCase() === studentRecord.department.trim().toUpperCase()
  );
  if (!isDeptEligible) {
    return fail(res, 400, `Application rejected: Your department (${studentRecord.department}) is not eligible for this drive. Eligible departments: ${companyRecord.eligibleDepartments.join(', ')}`);
  }

  // 7. Workflow Rule: Duplicate applications not allowed
  const existingApp = await Application.findOne({
    studentId: studentRecord.studentId,
    driveId: driveRecord.driveId
  });
  if (existingApp) {
    return fail(res, 400, `Duplicate application: You have already applied for the ${companyRecord.name} drive.`);
  }

  // 8. Create Application
  const applicationId = generateApplicationId();
  const application = await Application.create({
    applicationId,
    studentId: studentRecord.studentId,
    driveId: driveRecord.driveId,
    appliedAt: new Date().toISOString().split('T')[0],
    currentRound: driveRecord.rounds[0] || 'Aptitude',
    status: 'APPLIED'
  });

  const populated = {
    ...application.toObject(),
    student: studentRecord,
    drive: {
      ...driveRecord.toObject(),
      company: companyRecord
    }
  };

  return ok(res, populated, `Successfully applied to ${companyRecord.name} for the ${driveRecord.title} role`, 201);
});

// @desc    Get all applications
// @route   GET /api/applications
// @access  Private
const getApplications = asyncHandler(async (req, res) => {
  const query = {};

  // Filters
  if (req.query.status) {
    query.status = req.query.status.trim().toUpperCase();
  }

  if (req.query.driveId) {
    query.driveId = req.query.driveId;
  }

  // If user is STUDENT, restrict to their own applications
  if (req.user && req.user.role === 'STUDENT') {
    if (!req.user.studentId) {
      return fail(res, 400, 'Student profile not found');
    }
    query.studentId = req.user.studentId;
  } else if (req.query.studentId) {
    query.studentId = req.query.studentId;
  }

  const applications = await Application.find(query).sort({ createdAt: -1 });

  // Manually resolve relations
  const populatedApps = [];
  for (const app of applications) {
    const student = await Student.findOne({ studentId: app.studentId });
    const drive = await Drive.findOne({ driveId: app.driveId });
    let company = null;
    if (drive) {
      company = await Company.findOne({ companyId: drive.companyId });
    }

    populatedApps.push({
      ...app.toObject(),
      student,
      drive: drive ? {
        ...drive.toObject(),
        company
      } : null
    });
  }

  return ok(res, populatedApps, 'Applications retrieved successfully');
});

// @desc    Update application status
// @route   PUT /api/applications/:id
// @access  Private
const updateApplicationStatus = asyncHandler(async (req, res) => {
  const { status, currentRound } = req.body;
  
  let application = await Application.findById(req.params.id);
  if (!application) {
    application = await Application.findOne({ applicationId: req.params.id });
  }

  if (!application) {
    return fail(res, 404, `Application not found`);
  }

  if (status) {
    const normalizedStatus = status.trim().toUpperCase();
    const validStatuses = ['APPLIED', 'SHORTLISTED', 'SELECTED', 'REJECTED'];
    if (!validStatuses.includes(normalizedStatus)) {
      return fail(res, 400, `Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }
    application.status = normalizedStatus;

    // If the status is SELECTED, update Student status to PLACED
    if (normalizedStatus === 'SELECTED') {
      await Student.updateOne({ studentId: application.studentId }, { status: 'PLACED' });
    }
  }

  if (currentRound) {
    application.currentRound = currentRound.trim();
  }

  await application.save();

  // Resolve population
  const student = await Student.findOne({ studentId: application.studentId });
  const drive = await Drive.findOne({ driveId: application.driveId });
  let company = null;
  if (drive) {
    company = await Company.findOne({ companyId: drive.companyId });
  }

  const populated = {
    ...application.toObject(),
    student,
    drive: drive ? {
      ...drive.toObject(),
      company
    } : null
  };

  return ok(res, populated, `Application updated successfully`);
});

module.exports = {
  applyForDrive,
  getApplications,
  updateApplicationStatus
};
