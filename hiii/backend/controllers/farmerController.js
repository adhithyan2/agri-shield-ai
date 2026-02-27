const Farmer = require('../models/Farmer');
const Village = require('../models/Village');

const generateFarmerId = (villageCode) => {
  const year = new Date().getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${villageCode}-${year}-${random}`;
};

exports.registerFarmer = async (req, res) => {
  try {
    const { name, villageId, landArea, soilType, cropHistory, mobile } = req.body;

    const village = await Village.findById(villageId);
    if (!village) {
      return res.status(404).json({ message: 'Village not found' });
    }

    let farmerId;
    let exists = true;
    while (exists) {
      farmerId = generateFarmerId(village.villageCode);
      exists = await Farmer.findOne({ farmerId });
    }

    const farmer = await Farmer.create({
      farmerId,
      name,
      villageId,
      landArea,
      soilType,
      cropHistory: cropHistory || [],
      mobile: mobile || '',
      assignedBoothAgent: req.user.id
    });

    await farmer.populate('villageId');

    res.status(201).json({
      success: true,
      farmer
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getFarmer = async (req, res) => {
  try {
    const { id } = req.params;
    const farmer = await Farmer.findOne({ farmerId: id }).populate('villageId');

    if (!farmer) {
      return res.status(404).json({ message: 'Farmer not found' });
    }

    res.json({ success: true, farmer });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getFarmersByVillage = async (req, res) => {
  try {
    const { villageId } = req.query;
    let query = {};

    if (req.user.role === 'booth_agent') {
      query.villageId = req.user.villageId;
    } else if (villageId) {
      query.villageId = villageId;
    }

    const farmers = await Farmer.find(query).populate('villageId').sort({ createdAt: -1 });

    res.json({ success: true, count: farmers.length, farmers });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateFarmer = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, landArea, soilType, cropHistory, mobile } = req.body;

    const farmer = await Farmer.findOne({ farmerId: id });

    if (!farmer) {
      return res.status(404).json({ message: 'Farmer not found' });
    }

    if (req.user.role === 'booth_agent' && farmer.villageId.toString() !== req.user.villageId.toString()) {
      return res.status(403).json({ message: 'Access denied to this farmer' });
    }

    farmer.name = name || farmer.name;
    farmer.landArea = landArea || farmer.landArea;
    farmer.soilType = soilType || farmer.soilType;
    farmer.cropHistory = cropHistory || farmer.cropHistory;
    farmer.mobile = mobile || farmer.mobile;

    await farmer.save();
    await farmer.populate('villageId');

    res.json({ success: true, farmer });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteFarmer = async (req, res) => {
  try {
    const { id } = req.params;

    const farmer = await Farmer.findOne({ farmerId: id });

    if (!farmer) {
      return res.status(404).json({ message: 'Farmer not found' });
    }

    if (req.user.role === 'booth_agent' && farmer.villageId.toString() !== req.user.villageId.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Farmer.deleteOne({ farmerId: id });

    res.json({ success: true, message: 'Farmer deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
