const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Village = require('../models/Village');
const Farmer = require('../models/Farmer');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

exports.signup = async (req, res) => {
  try {
    const { name, email, password, role, villageId } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'farmer',
      villageId: villageId || null
    });

    res.status(201).json({
      success: true,
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        villageId: user.villageId
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password, farmerId } = req.body;

    if (farmerId) {
      const farmer = await Farmer.findOne({ farmerId }).populate('villageId');
      if (!farmer) {
        return res.status(401).json({ message: 'Invalid Farmer ID' });
      }

      return res.json({
        success: true,
        token: generateToken(farmer._id + '_farmer'),
        user: {
          id: farmer._id,
          name: farmer.name,
          role: 'farmer',
          farmerId: farmer.farmerId,
          villageId: farmer.villageId,
          landArea: farmer.landArea,
          soilType: farmer.soilType
        },
        isFarmer: true
      });
    }

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const village = user.villageId ? await Village.findById(user.villageId) : null;

    res.json({
      success: true,
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        villageId: user.villageId,
        villageName: village ? village.villageName : null,
        villageCode: village ? village.villageCode : null
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('villageId');
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
