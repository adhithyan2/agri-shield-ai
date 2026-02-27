const express = require('express');
const router = express.Router();
const { 
  createVillage, 
  getVillages, 
  getVillage, 
  assignBoothAgent,
  getAnalytics 
} = require('../controllers/villageController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/', protect, authorize('super_admin'), createVillage);
router.get('/', protect, getVillages);
router.get('/analytics', protect, authorize('super_admin'), getAnalytics);
router.get('/:id', protect, getVillage);
router.post('/assign-agent', protect, authorize('super_admin'), assignBoothAgent);

module.exports = router;
