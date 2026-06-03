const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
  interviewId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  applicationId: {
    type: String,
    required: true,
    trim: true
  },
  round: {
    type: String,
    required: true,
    trim: true
  },
  interviewer: {
    type: String,
    trim: true
  },
  interviewDate: {
    type: String,
    trim: true
  },
  result: {
    type: String,
    default: 'pending'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Interview', interviewSchema);
