const Village = require('../models/Village');
const User = require('../models/User');
const Farmer = require('../models/Farmer');

exports.createVillage = async (req, res) => {
  try {
    const { villageName, villageCode, district, state } = req.body;

    const existingVillage = await Village.findOne({ villageCode });
    if (existingVillage) {
      return res.status(400).json({ message: 'Village code already exists' });
    }

    const village = await Village.create({
      villageName,
      villageCode,
      district,
      state
    });

    res.status(201).json({ success: true, village });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getVillages = async (req, res) => {
  try {
    const villages = await Village.find().sort({ villageName: 1 });
    res.json({ success: true, count: villages.length, villages });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getVillage = async (req, res) => {
  try {
    const { id } = req.params;
    const village = await Village.findById(id);

    if (!village) {
      return res.status(404).json({ message: 'Village not found' });
    }

    const farmers = await Farmer.countDocuments({ villageId: id });
    const boothAgents = await User.countDocuments({ villageId: id, role: 'booth_agent' });

    res.json({ 
      success: true, 
      village, 
      stats: { farmers, boothAgents } 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.assignBoothAgent = async (req, res) => {
  try {
    const { villageId } = req.body;
    const { userId } = req.params;

    const village = await Village.findById(villageId);
    if (!village) {
      return res.status(404).json({ message: 'Village not found' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.villageId = villageId;
    user.role = 'booth_agent';
    await user.save();

    res.json({ success: true, message: 'Booth agent assigned successfully', user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAnalytics = async (req, res) => {
  try {
    const villages = await Village.find();
    const analytics = [];

    for (const village of villages) {
      const farmers = await Farmer.find({ villageId: village._id });
      const totalLand = farmers.reduce((sum, f) => sum + f.landArea, 0);
      const totalMoneySaved = farmers.reduce((sum, f) => sum + (f.moneySaved || 0), 0);

      analytics.push({
        village: village.villageName,
        villageCode: village.villageCode,
        farmerCount: farmers.length,
        totalLand,
        totalMoneySaved
      });
    }

    const totalFarmers = await Farmer.countDocuments();
    const totalLand = await Farmer.aggregate([
      { $group: { _id: null, total: { $sum: '$landArea' } } }
    ]);
    const totalMoneySaved = await Farmer.aggregate([
      { $group: { _id: null, total: { $sum: '$moneySaved' } } }
    ]);

    res.json({
      success: true,
      analytics,
      summary: {
        totalVillages: villages.length,
        totalFarmers,
        totalLandArea: totalLand[0]?.total || 0,
        totalMoneySaved: totalMoneySaved[0]?.total || 0
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
