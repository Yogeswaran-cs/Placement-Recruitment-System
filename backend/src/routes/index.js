const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/authMiddleware');

// Controllers
const { syncDataset } = require('../controllers/syncController');
const { registerUser, loginUser, getMe } = require('../controllers/authController');
const { getHealth } = require('../controllers/healthController');
const { getStats } = require('../controllers/statsController');
const {
  getStudents,
  searchStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent
} = require('../controllers/studentController');
const {
  getCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany
} = require('../controllers/companyController');
const {
  getDrives,
  getDriveById,
  createDrive,
  updateDrive
} = require('../controllers/driveController');
const {
  applyForDrive,
  getApplications,
  updateApplicationStatus
} = require('../controllers/applicationController');
const {
  scheduleInterview,
  updateInterviewResult,
  getInterviews
} = require('../controllers/interviewController');

// 1. Public Routes
router.post('/auth/register', registerUser);
router.post('/auth/login', loginUser);
router.get('/health', getHealth);

// 2. Auth Required Routes
router.use(protect);

router.get('/auth/me', getMe);

// Sync Route
router.post('/sync', syncDataset);

// Student Routes (CRITICAL: Search route MUST be before /:id)
router.get('/students/search', searchStudents);
router.get('/students', getStudents);
router.post('/students', createStudent);
router.get('/students/:id', getStudentById);
router.put('/students/:id', updateStudent);
router.delete('/students/:id', deleteStudent);

// Company Routes
router.get('/companies', getCompanies);
router.post('/companies', createCompany);
router.get('/companies/:id', getCompanyById);
router.put('/companies/:id', updateCompany);
router.delete('/companies/:id', deleteCompany);

// Drive Routes
router.get('/drives', getDrives);
router.post('/drives', createDrive);
router.get('/drives/:id', getDriveById);
router.put('/drives/:id', updateDrive);

// Application Routes
router.get('/applications', getApplications);
router.post('/applications', applyForDrive);
router.put('/applications/:id', updateApplicationStatus);

// Interview Routes
router.get('/interviews', getInterviews);
router.post('/interviews', scheduleInterview);
router.put('/interviews/:id', updateInterviewResult);

// Stats / Analytics Routes
router.get('/stats', getStats);

module.exports = router;
