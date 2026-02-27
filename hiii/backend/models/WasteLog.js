const mongoose = require('mongoose');

const wasteLogSchema = new mongoose.Schema({
  farmerId: {
    type: String,
    required: [true, 'Farmer ID is required']
  },
  wasteType: {
    type: String,
    required: [true, 'Waste type is required'],
    enum: ['crop_residue', 'vegetable_waste', 'animal_waste', 'packaging', 'other']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: 0
  },
  estimatedIncome: {
    type: Number,
    default: 0
  },
  climateCondition: {
    type: String,
    enum: ['sunny', 'rainy', 'cloudy', 'humid'],
    default: 'sunny'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('WasteLog', wasteLogSchema);
