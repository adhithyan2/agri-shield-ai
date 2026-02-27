const mongoose = require('mongoose');

const farmerSchema = new mongoose.Schema({
  farmerId: {
    type: String,
    required: [true, 'Farmer ID is required'],
    unique: true
  },
  name: {
    type: String,
    required: [true, 'Farmer name is required'],
    trim: true
  },
  villageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Village',
    required: true
  },
  landArea: {
    type: Number,
    required: [true, 'Land area is required'],
    min: 0
  },
  soilType: {
    type: String,
    required: [true, 'Soil type is required'],
    enum: ['clay', 'sandy', 'loamy', 'silty', 'peaty', 'chalky']
  },
  cropHistory: {
    type: [String],
    default: []
  },
  mobile: {
    type: String,
    default: ''
  },
  assignedBoothAgent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  moneySaved: {
    type: Number,
    default: 0
  }
});

farmerSchema.index({ villageId: 1, farmerId: 1 });

module.exports = mongoose.model('Farmer', farmerSchema);
