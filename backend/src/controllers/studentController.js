const Student = require('../models/Student');
const { ok, fail } = require('../utils/response');
const { sanitizeRecord, validateRecord } = require('../utils/validate');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Get all students (with search, filter, pagination)
// @route   GET /api/students
// @access  Private
const getStudents = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Build query
  const query = {};

  if (req.query.department) {
    query.department = req.query.department.trim().toUpperCase();
  }

  if (req.query.status) {
    query.status = req.query.status.trim().toUpperCase();
  }

  // If search query is passed in list endpoint
  if (req.query.q) {
    const searchRegex = new RegExp(req.query.q.trim(), 'i');
    query.$or = [
      { name: searchRegex },
      { studentId: searchRegex },
      { email: searchRegex },
      { department: searchRegex },
      { skills: searchRegex }
    ];
  }

  const total = await Student.countDocuments(query);
  const students = await Student.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return ok(res, {
    students,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    }
  }, 'Students retrieved successfully');
});

// @desc    Search students (explicit endpoint)
// @route   GET /api/students/search
// @access  Private
const searchStudents = asyncHandler(async (req, res) => {
  const searchTerm = req.query.q ? req.query.q.trim() : '';
  
  if (!searchTerm) {
    const students = await Student.find({}).sort({ createdAt: -1 }).limit(50);
    return ok(res, students, 'All students retrieved (limit 50)');
  }

  const searchRegex = new RegExp(searchTerm, 'i');
  const query = {
    $or: [
      { name: searchRegex },
      { studentId: searchRegex },
      { email: searchRegex },
      { department: searchRegex },
      { skills: searchRegex }
    ]
  };

  const students = await Student.find(query).sort({ createdAt: -1 });
  return ok(res, students, `Students matching search term '${searchTerm}' retrieved`);
});

// @desc    Get student by ID
// @route   GET /api/students/:id
// @access  Private
const getStudentById = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) {
    return fail(res, 404, `Student not found with ID ${req.params.id}`);
  }
  return ok(res, student, 'Student retrieved successfully');
});

// @desc    Create student
// @route   POST /api/students
// @access  Private
const createStudent = asyncHandler(async (req, res) => {
  const clean = sanitizeRecord(req.body);
  const { valid, reason } = validateRecord(clean);

  if (!valid) {
    return fail(res, 400, reason);
  }

  // Check duplicate ID
  const existing = await Student.findOne({ studentId: clean.studentId });
  if (existing) {
    return fail(res, 400, `Student with ID '${clean.studentId}' already exists`);
  }

  // Check duplicate Email
  const existingEmail = await Student.findOne({ email: clean.email });
  if (existingEmail) {
    return fail(res, 400, `Student with email '${clean.email}' already exists`);
  }

  const student = await Student.create(clean);
  return ok(res, student, 'Student record created successfully', 201);
});

// @desc    Update student
// @route   PUT /api/students/:id
// @access  Private
const updateStudent = asyncHandler(async (req, res) => {
  let student = await Student.findById(req.params.id);
  if (!student) {
    return fail(res, 404, `Student not found with ID ${req.params.id}`);
  }

  // Sanitize the inputs
  const clean = sanitizeRecord({ ...student.toObject(), ...req.body });
  
  // Custom validation check on fields we are updating
  const { valid, reason } = validateRecord(clean);
  if (!valid) {
    return fail(res, 400, reason);
  }

  // Check duplicate Student ID if updated
  if (clean.studentId !== student.studentId) {
    const existing = await Student.findOne({ studentId: clean.studentId });
    if (existing) {
      return fail(res, 400, `Student with ID '${clean.studentId}' already exists`);
    }
  }

  // Check duplicate Email if updated
  if (clean.email !== student.email) {
    const existingEmail = await Student.findOne({ email: clean.email });
    if (existingEmail) {
      return fail(res, 400, `Student with email '${clean.email}' already exists`);
    }
  }

  student = await Student.findByIdAndUpdate(req.params.id, clean, {
    new: true,
    runValidators: true
  });

  return ok(res, student, 'Student updated successfully');
});

// @desc    Delete student
// @route   DELETE /api/students/:id
// @access  Private
const deleteStudent = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) {
    return fail(res, 404, `Student not found with ID ${req.params.id}`);
  }
  await student.deleteOne();
  return ok(res, null, 'Student deleted successfully');
});

module.exports = {
  getStudents,
  searchStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent
};
