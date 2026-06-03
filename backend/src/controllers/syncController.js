const { fetchToken } = require('../services/tokenService');
const { fetchDataset } = require('../services/datasetService');

// Import all models
const Student = require('../models/Student');
const Company = require('../models/Company');
const Drive = require('../models/Drive');
const Application = require('../models/Application');
const Interview = require('../models/Interview');

const { sanitizeRecord, validateRecord } = require('../utils/validate');
const { ok, fail } = require('../utils/response');
const asyncHandler = require('../middleware/asyncHandler');

// POST /sync
const syncDataset = asyncHandler(async (req, res) => {
  console.log('Starting full 5-entity synchronization...');
  
  // 1. Fetch Token & dynamic dataUrl
  let tokenInfo;
  try {
    tokenInfo = await fetchToken();
  } catch (error) {
    return fail(res, 500, `External API authentication failed: ${error.message}`);
  }

  const { token, dataUrl } = tokenInfo;

  // 2. Fetch Dataset
  let payload;
  try {
    payload = await fetchDataset(token, dataUrl);
  } catch (error) {
    return fail(res, 500, `Failed to retrieve dataset: ${error.message}`);
  }

  if (!payload || typeof payload !== 'object') {
    return fail(res, 500, 'Dataset response is not a valid object payload');
  }

  const syncStats = {
    students: { fetched: 0, inserted: 0, updated: 0, failed: 0 },
    companies: { fetched: 0, inserted: 0, updated: 0, failed: 0 },
    drives: { fetched: 0, inserted: 0, updated: 0, failed: 0 },
    applications: { fetched: 0, inserted: 0, updated: 0, failed: 0 },
    interviews: { fetched: 0, inserted: 0, updated: 0, failed: 0 }
  };

  // --- 1. Sync Companies ---
  if (Array.isArray(payload.companies)) {
    syncStats.companies.fetched = payload.companies.length;
    for (const raw of payload.companies) {
      if (!raw.companyId || !raw.name) {
        syncStats.companies.failed++;
        continue;
      }
      try {
        const companyId = String(raw.companyId).trim();
        const existing = await Company.findOne({ companyId });
        
        const cleanData = {
          companyId,
          name: String(raw.name).trim(),
          role: String(raw.role || 'Software Engineer').trim(),
          packageLPA: parseFloat(raw.package || 0),
          eligibleDepartments: Array.isArray(raw.eligibleDepartments) ? raw.eligibleDepartments.map(d => String(d).trim().toUpperCase()) : [],
          minimumCgpa: parseFloat(raw.minimumCgpa || 0),
          driveDate: raw.driveDate || null,
          status: raw.status || 'upcoming'
        };

        if (existing) {
          await Company.updateOne({ companyId }, cleanData);
          syncStats.companies.updated++;
        } else {
          await Company.create(cleanData);
          syncStats.companies.inserted++;
        }
      } catch (err) {
        console.error('Failed syncing company:', err.message);
        syncStats.companies.failed++;
      }
    }
  }

  // --- 2. Sync Students ---
  if (Array.isArray(payload.students)) {
    syncStats.students.fetched = payload.students.length;
    for (const raw of payload.students) {
      const clean = sanitizeRecord(raw);
      const { valid } = validateRecord(clean);
      if (!valid) {
        syncStats.students.failed++;
        continue;
      }
      try {
        const existing = await Student.findOne({ studentId: clean.studentId });
        // Add additional schema fields if present in synced data
        const studentData = {
          ...clean,
          graduationYear: raw.graduationYear || 2026,
          phone: raw.phone || '',
          status: raw.status || 'active'
        };

        if (existing) {
          await Student.updateOne({ studentId: clean.studentId }, studentData);
          syncStats.students.updated++;
        } else {
          await Student.create(studentData);
          syncStats.students.inserted++;
        }
      } catch (err) {
        console.error('Failed syncing student:', err.message);
        syncStats.students.failed++;
      }
    }
  }

  // --- 3. Sync Drives ---
  if (Array.isArray(payload.drives)) {
    syncStats.drives.fetched = payload.drives.length;
    for (const raw of payload.drives) {
      if (!raw.driveId || !raw.companyId) {
        syncStats.drives.failed++;
        continue;
      }
      try {
        const driveId = String(raw.driveId).trim();
        const existing = await Drive.findOne({ driveId });
        
        const cleanData = {
          driveId,
          companyId: String(raw.companyId).trim(),
          title: String(raw.title || '').trim(),
          mode: String(raw.mode || 'offline').trim(),
          location: String(raw.location || '').trim(),
          registrationDeadline: raw.registrationDeadline || null,
          rounds: Array.isArray(raw.rounds) ? raw.rounds.map(r => String(r).trim()) : [],
          status: raw.status || 'open'
        };

        if (existing) {
          await Drive.updateOne({ driveId }, cleanData);
          syncStats.drives.updated++;
        } else {
          await Drive.create(cleanData);
          syncStats.drives.inserted++;
        }
      } catch (err) {
        console.error('Failed syncing drive:', err.message);
        syncStats.drives.failed++;
      }
    }
  }

  // --- 4. Sync Applications ---
  if (Array.isArray(payload.applications)) {
    syncStats.applications.fetched = payload.applications.length;
    for (const raw of payload.applications) {
      if (!raw.applicationId || !raw.studentId || !raw.driveId) {
        syncStats.applications.failed++;
        continue;
      }
      try {
        const applicationId = String(raw.applicationId).trim();
        const existing = await Application.findOne({ applicationId });
        
        const cleanData = {
          applicationId,
          studentId: String(raw.studentId).trim(),
          driveId: String(raw.driveId).trim(),
          appliedAt: raw.appliedAt || null,
          currentRound: String(raw.currentRound || 'Aptitude').trim(),
          status: String(raw.status || 'applied').trim().toUpperCase()
        };

        if (existing) {
          await Application.updateOne({ applicationId }, cleanData);
          syncStats.applications.updated++;
        } else {
          await Application.create(cleanData);
          syncStats.applications.inserted++;
        }
      } catch (err) {
        console.error('Failed syncing application:', err.message);
        syncStats.applications.failed++;
      }
    }
  }

  // --- 5. Sync Interviews ---
  if (Array.isArray(payload.interviews)) {
    syncStats.interviews.fetched = payload.interviews.length;
    for (const raw of payload.interviews) {
      if (!raw.interviewId || !raw.applicationId) {
        syncStats.interviews.failed++;
        continue;
      }
      try {
        const interviewId = String(raw.interviewId).trim();
        const existing = await Interview.findOne({ interviewId });
        
        const cleanData = {
          interviewId,
          applicationId: String(raw.applicationId).trim(),
          round: String(raw.round || '').trim(),
          interviewer: String(raw.interviewer || '').trim(),
          interviewDate: raw.interviewDate || null,
          result: String(raw.result || 'pending').trim().toLowerCase()
        };

        if (existing) {
          await Interview.updateOne({ interviewId }, cleanData);
          syncStats.interviews.updated++;
        } else {
          await Interview.create(cleanData);
          syncStats.interviews.inserted++;
        }
      } catch (err) {
        console.error('Failed syncing interview:', err.message);
        syncStats.interviews.failed++;
      }
    }
  }

  return ok(res, syncStats, 'All placement entities synchronized successfully');
});

module.exports = {
  syncDataset
};
