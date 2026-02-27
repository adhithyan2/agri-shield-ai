const express = require('express');
const router = express.Router();
const { 
  calculateWaste, 
  getWasteHistory,
  getWasteTypes 
} = require('../controllers/wasteController');
const { protect } = require('../middleware/authMiddleware');

router.post('/calc', protect, calculateWaste);
router.get('/history/:farmerId', protect, getWasteHistory);
router.get('/types', getWasteTypes);

module.exports = router;
