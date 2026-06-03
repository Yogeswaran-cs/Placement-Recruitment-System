const Drive = require('../models/Drive');
const Company = require('../models/Company');
const { ok, fail } = require('../utils/response');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Get all drives
// @route   GET /api/drives
// @access  Private
const getDrives = asyncHandler(async (req, res) => {
  const query = {};

  if (req.query.status) {
    query.status = req.query.status.trim().toLowerCase();
  }

  const drives = await Drive.find(query).sort({ createdAt: -1 });
  
  // Resolve company details manually based on companyId string
  const populatedDrives = [];
  for (const drive of drives) {
    const company = await Company.findOne({ companyId: drive.companyId });
    populatedDrives.push({
      ...drive.toObject(),
      company
    });
  }

  return ok(res, populatedDrives, 'Drives retrieved successfully');
});

// @desc    Get drive by ID
// @route   GET /api/drives/:id
// @access  Private
const getDriveById = asyncHandler(async (req, res) => {
  const drive = await Drive.findById(req.params.id);
  if (!drive) {
    return fail(res, 404, `Placement Drive not found with ID ${req.params.id}`);
  }
  
  const company = await Company.findOne({ companyId: drive.companyId });
  const populated = {
    ...drive.toObject(),
    company
  };

  return ok(res, populated, 'Drive retrieved successfully');
});

// @desc    Create drive
// @route   POST /api/drives
// @access  Private
const createDrive = asyncHandler(async (req, res) => {
  const { driveId, companyId, title, mode, location, registrationDeadline, rounds, status } = req.body;

  if (!driveId || !companyId || !title) {
    return fail(res, 400, 'driveId, companyId, and title are required');
  }

  // Check company exists
  const companyRecord = await Company.findOne({ companyId: companyId.trim() });
  if (!companyRecord) {
    return fail(res, 400, `Associated company not found for companyId: ${companyId}`);
  }

  // Check duplicate driveId
  const existing = await Drive.findOne({ driveId: driveId.trim() });
  if (existing) {
    return fail(res, 400, `Drive with ID '${driveId}' already exists`);
  }

  const normalizedRounds = Array.isArray(rounds) ? rounds.map(r => r.trim()) : [];

  const drive = await Drive.create({
    driveId: driveId.trim(),
    companyId: companyId.trim(),
    title: title.trim(),
    mode: mode || 'offline',
    location: location || '',
    registrationDeadline: registrationDeadline || '',
    rounds: normalizedRounds,
    status: status || 'open'
  });

  const populated = {
    ...drive.toObject(),
    company: companyRecord
  };

  return ok(res, populated, 'Placement drive created successfully', 201);
});

// @desc    Update drive
// @route   PUT /api/drives/:id
// @access  Private
const updateDrive = asyncHandler(async (req, res) => {
  let drive = await Drive.findById(req.params.id);
  if (!drive) {
    return fail(res, 404, `Drive not found with ID ${req.params.id}`);
  }

  const { driveId, companyId, title, mode, location, registrationDeadline, rounds, status } = req.body;

  if (driveId) {
    const existing = await Drive.findOne({ driveId: driveId.trim() });
    if (existing && existing._id.toString() !== req.params.id) {
      return fail(res, 400, `Drive with ID '${driveId}' already exists`);
    }
    drive.driveId = driveId.trim();
  }

  if (companyId) {
    const companyRecord = await Company.findOne({ companyId: companyId.trim() });
    if (!companyRecord) {
      return fail(res, 400, `Associated company not found for companyId: ${companyId}`);
    }
    drive.companyId = companyId.trim();
  }

  if (title) drive.title = title.trim();
  if (mode) drive.mode = mode;
  if (location) drive.location = location;
  if (registrationDeadline !== undefined) drive.registrationDeadline = registrationDeadline;
  if (rounds) drive.rounds = Array.isArray(rounds) ? rounds.map(r => r.trim()) : [];
  if (status) drive.status = status.toLowerCase();

  await drive.save();

  const company = await Company.findOne({ companyId: drive.companyId });
  const populated = {
    ...drive.toObject(),
    company
  };

  return ok(res, populated, 'Drive updated successfully');
});

module.exports = {
  getDrives,
  getDriveById,
  createDrive,
  updateDrive
};
