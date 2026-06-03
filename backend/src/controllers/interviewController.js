const Interview = require('../models/Interview');
const Application = require('../models/Application');
const Student = require('../models/Student');
const Drive = require('../models/Drive');
const Company = require('../models/Company');
const { ok, fail } = require('../utils/response');
const asyncHandler = require('../middleware/asyncHandler');

// Helper to generate interview ID
const generateInterviewId = () => {
  return `INT${Math.floor(1000 + Math.random() * 9000)}`;
};

// @desc    Schedule interview round
// @route   POST /api/interviews
// @access  Private
const scheduleInterview = asyncHandler(async (req, res) => {
  const { applicationId, round, interviewer, interviewDate } = req.body;

  if (!applicationId || !round || !interviewDate) {
    return fail(res, 400, 'applicationId, round, and interviewDate are required');
  }

  // Check application exists
  const application = await Application.findOne({ applicationId: applicationId.trim() });
  if (!application) {
    return fail(res, 404, `Associated application not found`);
  }

  const interviewId = generateInterviewId();
  const interview = await Interview.create({
    interviewId,
    applicationId: applicationId.trim(),
    round: round.trim(),
    interviewer: interviewer ? interviewer.trim() : 'TBD',
    interviewDate: interviewDate,
    result: 'pending'
  });

  // Resolve population
  const student = await Student.findOne({ studentId: application.studentId });
  const drive = await Drive.findOne({ driveId: application.driveId });
  let company = null;
  if (drive) {
    company = await Company.findOne({ companyId: drive.companyId });
  }

  const populated = {
    ...interview.toObject(),
    application: {
      ...application.toObject(),
      student,
      drive: drive ? {
        ...drive.toObject(),
        company
      } : null
    }
  };

  return ok(res, populated, 'Interview round scheduled successfully', 201);
});

// @desc    Update interview result
// @route   PUT /api/interviews/:id
// @access  Private
const updateInterviewResult = asyncHandler(async (req, res) => {
  const { result, feedback } = req.body;

  if (!result) {
    return fail(res, 400, 'Result is required');
  }

  const normalizedResult = result.trim().toLowerCase();
  const validResults = ['pass', 'fail', 'pending'];
  if (!validResults.includes(normalizedResult)) {
    return fail(res, 400, `Invalid result. Must be one of: ${validResults.join(', ')}`);
  }

  let interview = await Interview.findById(req.params.id);
  if (!interview) {
    interview = await Interview.findOne({ interviewId: req.params.id });
  }

  if (!interview) {
    return fail(res, 404, `Interview not found`);
  }

  interview.result = normalizedResult;
  if (feedback !== undefined) {
    interview.feedback = feedback.trim();
  }

  await interview.save();

  // If pass and it is an HR round, we can auto-recommend selecting the application
  const application = await Application.findOne({ applicationId: interview.applicationId });
  if (application) {
    if (normalizedResult === 'pass') {
      if (interview.round.toUpperCase() === 'HR') {
        application.status = 'SELECTED';
        await Student.updateOne({ studentId: application.studentId }, { status: 'PLACED' });
      } else {
        application.status = 'SHORTLISTED';
      }
      await application.save();
    } else if (normalizedResult === 'fail') {
      application.status = 'REJECTED';
      await application.save();
    }
  }

  // Resolve population
  let student = null;
  let drive = null;
  let company = null;
  if (application) {
    student = await Student.findOne({ studentId: application.studentId });
    drive = await Drive.findOne({ driveId: application.driveId });
    if (drive) {
      company = await Company.findOne({ companyId: drive.companyId });
    }
  }

  const populated = {
    ...interview.toObject(),
    application: application ? {
      ...application.toObject(),
      student,
      drive: drive ? {
        ...drive.toObject(),
        company
      } : null
    } : null
  };

  return ok(res, populated, `Interview result updated to ${normalizedResult}`);
});

// @desc    Get all interviews
// @route   GET /api/interviews
// @access  Private
const getInterviews = asyncHandler(async (req, res) => {
  const query = {};

  if (req.query.applicationId) {
    query.applicationId = req.query.applicationId;
  }

  const interviews = await Interview.find(query).sort({ interviewDate: 1 });

  // Manually resolve relations
  const populatedInterviews = [];
  for (const interview of interviews) {
    const application = await Application.findOne({ applicationId: interview.applicationId });
    let student = null;
    let drive = null;
    let company = null;
    
    if (application) {
      student = await Student.findOne({ studentId: application.studentId });
      drive = await Drive.findOne({ driveId: application.driveId });
      if (drive) {
        company = await Company.findOne({ companyId: drive.companyId });
      }
    }

    populatedInterviews.push({
      ...interview.toObject(),
      application: application ? {
        ...application.toObject(),
        student,
        drive: drive ? {
          ...drive.toObject(),
          company
        } : null
      } : null
    });
  }

  return ok(res, populatedInterviews, 'Interviews retrieved successfully');
});

module.exports = {
  scheduleInterview,
  updateInterviewResult,
  getInterviews
};
