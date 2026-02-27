const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  productName: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  website: {
    type: String,
    required: [true, 'Website is required'],
    enum: ['amazon', 'flipkart', 'local_agri_store']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: 0
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: 0,
    max: 5
  },
  url: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['fertilizer', 'seeds', 'pesticide', 'equipment'],
    default: 'fertilizer'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

productSchema.index({ productName: 'text', category: 1 });

module.exports = mongoose.model('Product', productSchema);
