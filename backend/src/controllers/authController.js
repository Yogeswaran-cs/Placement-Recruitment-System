const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Student = require('../models/Student');
const { ok, fail } = require('../utils/response');
const asyncHandler = require('../middleware/asyncHandler');

// Helper to sign token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { username, password, role, studentId } = req.body;

  if (!username || !password) {
    return fail(res, 400, 'Username and password are required');
  }

  // Check if user exists
  const userExists = await User.findOne({ username });
  if (userExists) {
    return fail(res, 400, 'User already exists');
  }

  // If registering as student, check if the student ID exists in synced dataset
  if (role === 'STUDENT') {
    if (!studentId) {
      return fail(res, 400, 'Student ID is required for student registration');
    }
    const studentRecordExists = await Student.findOne({ studentId });
    if (!studentRecordExists) {
      return fail(res, 400, `Student ID '${studentId}' is not registered. Please sync the dataset first.`);
    }
    
    // Check if studentId is already linked to another user account
    const linkedUser = await User.findOne({ studentId, role: 'STUDENT' });
    if (linkedUser) {
      return fail(res, 400, `An account is already linked to student ID '${studentId}'`);
    }
  }

  // Create user
  const user = await User.create({
    username,
    password,
    role: role || 'STUDENT',
    studentId: role === 'STUDENT' ? studentId : null
  });

  if (user) {
    return ok(res, {
      _id: user._id,
      username: user.username,
      role: user.role,
      studentId: user.studentId,
      token: generateToken(user._id)
    }, 'User registered successfully', 201);
  } else {
    return fail(res, 400, 'Invalid user data');
  }
});

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return fail(res, 400, 'Username and password are required');
  }

  // Check for user
  const user = await User.findOne({ username });
  if (!user) {
    return fail(res, 401, 'Invalid username or password');
  }

  // Check password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return fail(res, 401, 'Invalid username or password');
  }

  return ok(res, {
    _id: user._id,
    username: user.username,
    role: user.role,
    studentId: user.studentId,
    token: generateToken(user._id)
  }, 'Logged in successfully');
});

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  // req.user is already fetched by protect middleware
  return ok(res, {
    _id: req.user._id,
    username: req.user.username,
    role: req.user.role,
    studentId: req.user.studentId
  }, 'Current user profile retrieved');
});

module.exports = {
  registerUser,
  loginUser,
  getMe
};
