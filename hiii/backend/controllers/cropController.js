const Farmer = require('../models/Farmer');

const cropDatabase = {
  rice: {
    name: 'Rice',
    nameTamil: 'அரிசி',
    nameHindi: 'चावल',
    nameTelugu: 'బియ్యం',
    optimalTemp: { min: 20, max: 35 },
    optimalRainfall: { min: 100, max: 250 },
    soilTypes: ['clay', 'loamy'],
    waterNeed: 'high',
    season: 'kharif',
    profitPotential: 45000,
    successRate: 0.85
  },
  wheat: {
    name: 'Wheat',
    nameTamil: 'கோதுமை',
    nameHindi: 'गेहूं',
    nameTelugu: 'గోధుమ',
    optimalTemp: { min: 15, max: 25 },
    optimalRainfall: { min: 50, max: 100 },
    soilTypes: ['loamy', 'clay'],
    waterNeed: 'medium',
    season: 'rabi',
    profitPotential: 35000,
    successRate: 0.80
  },
  cotton: {
    name: 'Cotton',
    nameTamil: 'பருத்தி',
    nameHindi: 'कपास',
    nameTelugu: 'पత్తा',
    optimalTemp: { min: 25, max: 38 },
    optimalRainfall: { min: 50, max: 80 },
    soilTypes: ['black', 'loamy'],
    waterNeed: 'medium',
    season: 'kharif',
    profitPotential: 55000,
    successRate: 0.75
  },
  sugarcane: {
    name: 'Sugarcane',
    nameTamil: 'கரும்பு',
    nameHindi: 'गन्ना',
    nameTelugu: 'తెలుగు',
    optimalTemp: { min: 24, max: 35 },
    optimalRainfall: { min: 150, max: 250 },
    soilTypes: ['loamy', 'clay'],
    waterNeed: 'high',
    season: 'annual',
    profitPotential: 80000,
    successRate: 0.90
  },
  groundnut: {
    name: 'Groundnut',
    nameTamil: 'நிலக்கடலை',
    nameHindi: 'मूंगफली',
    nameTelugu: 'పలాస్',
    optimalTemp: { min: 25, max: 33 },
    optimalRainfall: { min: 50, max: 100 },
    soilTypes: ['sandy', 'loamy'],
    waterNeed: 'medium',
    season: 'kharif',
    profitPotential: 25000,
    successRate: 0.78
  },
  maize: {
    name: 'Maize',
    nameTamil: 'மக்காச்சோளம்',
    nameHindi: 'मक्का',
    nameTelugu: 'మక్కువ',
    optimalTemp: { min: 20, max: 32 },
    optimalRainfall: { min: 50, max: 100 },
    soilTypes: ['loamy', 'sandy'],
    waterNeed: 'medium',
    season: 'kharif',
    profitPotential: 30000,
    successRate: 0.82
  },
  pulses: {
    name: 'Pulses',
    nameTamil: 'பருப்பு',
    nameHindi: 'दाल',
    nameTelugu: 'শিম',
    optimalTemp: { min: 20, max: 32 },
    optimalRainfall: { min: 40, max: 80 },
    soilTypes: ['loamy', 'sandy'],
    waterNeed: 'low',
    season: 'rabi',
    profitPotential: 20000,
    successRate: 0.75
  },
  vegetables: {
    name: 'Vegetables',
    nameTamil: 'காய்கறிகள்',
    nameHindi: 'सब्जियां',
    nameTelugu: 'కూరగాయలు',
    optimalTemp: { min: 18, max: 30 },
    optimalRainfall: { min: 50, max: 100 },
    soilTypes: ['loamy', 'sandy'],
    waterNeed: 'medium',
    season: 'all',
    profitPotential: 40000,
    successRate: 0.88
  },
  coconut: {
    name: 'Coconut',
    nameTamil: 'தேங்காய்',
    nameHindi: 'नारियल',
    nameTelugu: 'తెలుగు',
    optimalTemp: { min: 24, max: 32 },
    optimalRainfall: { min: 100, max: 250 },
    soilTypes: ['sandy', 'loamy'],
    waterNeed: 'high',
    season: 'all',
    profitPotential: 60000,
    successRate: 0.92
  },
  turmeric: {
    name: 'Turmeric',
    nameTamil: 'மஞ்சள்',
    nameHindi: 'हल्दी',
    nameTelugu: 'పసుపు',
    optimalTemp: { min: 20, max: 35 },
    optimalRainfall: { min: 100, max: 200 },
    soilTypes: ['loamy', 'clay'],
    waterNeed: 'high',
    season: 'kharif',
    profitPotential: 70000,
    successRate: 0.85
  }
};

const soilCompatibility = {
  clay: { rice: 0.9, wheat: 0.8, sugarcane: 0.85, vegetables: 0.75 },
  sandy: { groundnut: 0.9, maize: 0.75, coconut: 0.85, vegetables: 0.7 },
  loamy: { rice: 0.85, wheat: 0.9, sugarcane: 0.8, maize: 0.85, vegetables: 0.9, pulses: 0.85 },
  silty: { rice: 0.8, wheat: 0.75, vegetables: 0.85 },
  peaty: { vegetables: 0.7, rice: 0.6 },
  chalky: { wheat: 0.6, barley: 0.5 }
};

exports.getCropRecommendation = async (req, res) => {
  try {
    const { farmerId } = req.params;
    const { temperature = 30, rainfall = 100 } = req.query;

    const farmer = await Farmer.findOne({ farmerId });

    if (!farmer) {
      return res.status(404).json({ message: 'Farmer not found' });
    }

    const soilType = farmer.soilType;
    const landArea = farmer.landArea;
    const cropHistory = farmer.cropHistory || [];

    const cropScores = [];

    for (const [key, crop] of Object.entries(cropDatabase)) {
      const tempMatch = calculateTemperatureMatch(crop, parseFloat(temperature));
      const rainfallMatch = calculateRainfallMatch(crop, parseFloat(rainfall));
      const soilMatch = calculateSoilMatch(soilType, soilCompatibility, key);
      const historicalSuccess = calculateHistoricalSuccess(cropHistory, crop.name);

      const totalScore = (
        0.4 * tempMatch +
        0.3 * rainfallMatch +
        0.2 * soilMatch +
        0.1 * historicalSuccess
      ) * 100;

      const riskPercentage = Math.round((1 - totalScore / 100) * 100);
      const estimatedProfit = Math.round(crop.profitPotential * landArea);
      const moneyLossAvoided = Math.round(estimatedProfit * (totalScore / 100) - estimatedProfit * 0.5);

      cropScores.push({
        crop: crop.name,
        cropKey: key,
        score: Math.round(totalScore),
        riskPercentage,
        estimatedProfit,
        moneyLossAvoided: Math.max(0, moneyLossAvoided),
        temperatureMatch: Math.round(tempMatch * 100),
        rainfallMatch: Math.round(rainfallMatch * 100),
        soilMatch: Math.round(soilMatch * 100),
        historicalSuccess: Math.round(historicalSuccess * 100),
        details: crop
      });
    }

    const sortedCrops = cropScores.sort((a, b) => b.score - a.score);
    const top3 = sortedCrops.slice(0, 3);

    res.json({
      success: true,
      recommendations: top3,
      farmer: {
        farmerId: farmer.farmerId,
        name: farmer.name,
        soilType: farmer.soilType,
        landArea: farmer.landArea
      },
      currentConditions: {
        temperature: parseFloat(temperature),
        rainfall: parseFloat(rainfall)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

function calculateTemperatureMatch(crop, currentTemp) {
  const { min, max } = crop.optimalTemp;
  const optimal = (min + max) / 2;
  const range = (max - min) / 2;

  if (currentTemp >= min && currentTemp <= max) {
    return 1.0;
  } else if (Math.abs(currentTemp - optimal) <= range * 1.5) {
    return 0.6;
  } else {
    return 0.3;
  }
}

function calculateRainfallMatch(crop, currentRainfall) {
  const { min, max } = crop.optimalRainfall;

  if (currentRainfall >= min && currentRainfall <= max) {
    return 1.0;
  } else if (currentRainfall >= min * 0.7 && currentRainfall <= max * 1.3) {
    return 0.7;
  } else {
    return 0.4;
  }
}

function calculateSoilMatch(farmerSoil, compatibility, cropKey) {
  const soilScores = compatibility[farmerSoil] || {};
  return soilScores[cropKey] || 0.5;
}

function calculateHistoricalSuccess(history, cropName) {
  if (!history || history.length === 0) return 0.7;
  const matches = history.filter(h => 
    h.toLowerCase().includes(cropName.toLowerCase())
  );
  return matches.length > 0 ? 0.9 : 0.6;
}
