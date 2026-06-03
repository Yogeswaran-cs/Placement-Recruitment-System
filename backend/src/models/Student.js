const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  studentId: {
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
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  department: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  },
  cgpa: {
    type: Number,
    required: true,
    min: 0
  },
  skills: {
    type: [String],
    default: []
  },
  graduationYear: {
    type: Number
  },
  phone: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    default: 'active'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Student', studentSchema);
