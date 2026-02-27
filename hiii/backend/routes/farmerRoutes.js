const express = require('express');
const router = express.Router();
const { 
  registerFarmer, 
  getFarmer, 
  getFarmersByVillage, 
  updateFarmer,
  deleteFarmer 
} = require('../controllers/farmerController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/register', protect, authorize('super_admin', 'booth_agent'), registerFarmer);
router.get('/:id', protect, getFarmer);
router.get('/', protect, getFarmersByVillage);
router.put('/:id', protect, authorize('super_admin', 'booth_agent'), updateFarmer);
router.delete('/:id', protect, authorize('super_admin', 'booth_agent'), deleteFarmer);

module.exports = router;
