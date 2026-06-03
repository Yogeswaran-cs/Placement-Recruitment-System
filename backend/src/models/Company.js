const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  companyId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    trim: true
  },
  package: {
    type: Number,
    default: 0
  },
  eligibleDepartments: {
    type: [String],
    required: true
  },
  minimumCgpa: {
    type: Number,
    required: true,
    min: 0,
    max: 10
  },
  driveDate: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    default: 'upcoming'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Company', companySchema);
