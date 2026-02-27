const express = require('express');
const router = express.Router();
const { 
  searchProducts, 
  compareProducts, 
  getCategories,
  initializeProducts 
} = require('../controllers/productController');

router.get('/init', initializeProducts);
router.get('/search', searchProducts);
router.post('/compare', compareProducts);
router.get('/categories', getCategories);

module.exports = router;
