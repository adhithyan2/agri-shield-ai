const mongoose = require('mongoose');

const villageSchema = new mongoose.Schema({
  villageName: {
    type: String,
    required: [true, 'Village name is required'],
    trim: true
  },
  villageCode: {
    type: String,
    required: [true, 'Village code is required'],
    unique: true,
    uppercase: true
  },
  district: {
    type: String,
    required: [true, 'District is required'],
    trim: true
  },
  state: {
    type: String,
    required: [true, 'State is required'],
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Village', villageSchema);
