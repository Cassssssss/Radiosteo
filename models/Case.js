const mongoose = require('mongoose');

const CaseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  folders: [String],
  images: {
    type: Object,
    default: {}
  },
  mainImage: String,
  folderMainImages: {
    type: Object,
    default: {}
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  difficulty: {
    type: Number,
    min: 1,
    max: 5,
    default: 1
  },
  answer: {
    type: String,
    default: ''
  },
  sheet: { 
    type: String, 
    default: '' 
  },
  tags: {
    type: [String],
    default: []
  }
});

module.exports = mongoose.model('Case', CaseSchema);