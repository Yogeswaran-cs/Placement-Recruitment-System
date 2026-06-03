const mongoose = require('mongoose');

const driveSchema = new mongoose.Schema({
  driveId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  companyId: {
    type: String,
    required: true,
    trim: true
  },
  title: {
    type: String,
    trim: true
  },
  mode: {
    type: String,
    default: 'offline'
  },
  location: {
    type: String,
    trim: true
  },
  registrationDeadline: {
    type: String,
    trim: true
  },
  rounds: {
    type: [String],
    default: []
  },
  status: {
    type: String,
    default: 'open'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Drive', driveSchema);
