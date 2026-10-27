const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Resource title is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  subject: {
    type: String,
    trim: true,
    default: 'Physics'
  },
  classGrade: {
    type: String,
    trim: true,
    default: 'All Classes'
  },
  chapter: {
    type: String,
    trim: true,
    default: ''
  },
  pdf: {
    data: {
      type: Buffer,
      required: [true, 'PDF file data is required']
    },
    contentType: {
      type: String,
      default: 'application/pdf'
    },
    fileName: {
      type: String,
      required: true
    },
    fileSize: {
      type: Number,
      default: 0
    }
  },
  uploadedBy: {
    type: String,
    default: 'JD Sir (Admin)'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Resource', resourceSchema);
