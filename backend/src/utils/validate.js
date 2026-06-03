/**
 * Sanitizes a raw student record by trimming strings, normalizing department, and coercing types.
 * @param {Object} raw 
 * @returns {Object} clean record
 */
const sanitizeRecord = (raw) => {
  if (!raw) return {};

  const studentId = typeof raw.studentId === 'string' ? raw.studentId.trim() : (raw.studentId ? String(raw.studentId).trim() : '');
  const name = typeof raw.name === 'string' ? raw.name.trim() : (raw.name ? String(raw.name).trim() : '');
  const email = typeof raw.email === 'string' ? raw.email.trim() : (raw.email ? String(raw.email).trim() : '');
  const department = typeof raw.department === 'string' ? raw.department.trim().toUpperCase() : (raw.department ? String(raw.department).trim().toUpperCase() : '');
  
  let cgpa = parseFloat(raw.cgpa);
  if (isNaN(cgpa)) {
    cgpa = 0;
  }

  let skills = [];
  if (Array.isArray(raw.skills)) {
    skills = raw.skills.map(s => typeof s === 'string' ? s.trim() : String(s).trim()).filter(Boolean);
  } else if (typeof raw.skills === 'string') {
    skills = raw.skills.split(',').map(s => s.trim()).filter(Boolean);
  }

  const status = typeof raw.status === 'string' ? raw.status.trim().toUpperCase() : 'UNPLACED';
  const normalizedStatus = ['PLACED', 'UNPLACED'].includes(status) ? status : 'UNPLACED';

  return {
    studentId,
    name,
    email,
    cgpa,
    department,
    skills,
    status: normalizedStatus
  };
};

/**
 * Validates a sanitized student record.
 * @param {Object} clean 
 * @returns {Object} { valid: boolean, reason?: string }
 */
const validateRecord = (clean) => {
  if (!clean.studentId) {
    return { valid: false, reason: 'Student ID is required' };
  }
  if (!clean.name) {
    return { valid: false, reason: 'Student Name is required' };
  }
  if (!clean.email) {
    return { valid: false, reason: 'Student Email is required' };
  }
  
  // Basic email pattern check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(clean.email)) {
    return { valid: false, reason: `Invalid email format: ${clean.email}` };
  }

  if (typeof clean.cgpa !== 'number' || clean.cgpa < 0 || clean.cgpa > 10) {
    return { valid: false, reason: `CGPA must be a number between 0 and 10, got ${clean.cgpa}` };
  }

  if (!clean.department) {
    return { valid: false, reason: 'Department is required' };
  }

  return { valid: true };
};

module.exports = {
  sanitizeRecord,
  validateRecord
};
