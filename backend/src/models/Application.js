const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  applicationId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  studentId: {
    type: String,
    required: true,
    trim: true
  },
  driveId: {
    type: String,
    required: true,
    trim: true
  },
  appliedAt: {
    type: String,
    trim: true
  },
  currentRound: {
    type: String,
    default: 'Aptitude'
  },
  status: {
    type: String,
    default: 'APPLIED'
  }
}, {
  timestamps: true
});

// Index to prevent duplicate student application to a single drive
applicationSchema.index({ studentId: 1, driveId: 1 }, { unique: true });

module.exports = mongoose.model('Application', applicationSchema);
