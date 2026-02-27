const WasteLog = require('../models/WasteLog');
const Farmer = require('../models/Farmer');

const wasteValues = {
  crop_residue: {
    name: 'Crop Residue',
    nameTamil: 'பயிர் எச்சம்',
    nameHindi: 'फसल अवशेष',
    nameTelugu: ' పైకట',
    compostValue: 500,
    biogasValue: 800,
    resaleValue: 300,
    unit: 'quintal'
  },
  vegetable_waste: {
    name: 'Vegetable Waste',
    nameTamil: 'காய்கறி கழிவு',
    nameHindi: 'सब्जी अपशिष्ट',
    nameTelugu: 'కూరగాయల వ్యర్థం',
    compostValue: 800,
    biogasValue: 1200,
    resaleValue: 400,
    unit: 'quintal'
  },
  animal_waste: {
    name: 'Animal Waste',
    nameTamil: 'வளம் கழிவு',
    nameHindi: 'पशु अपशिष्ट',
    nameTelugu: 'జంతువు వ్యర్థం',
    compostValue: 600,
    biogasValue: 1500,
    resaleValue: 500,
    unit: 'quintal'
  },
  packaging: {
    name: 'Packaging Waste',
    nameTamil: 'பேக்கிங் கழிவு',
    nameHindi: 'पैकेजिंग अपशिष्ट',
    nameTelugu: ' packaging phase',
    compostValue: 100,
    biogasValue: 200,
    resaleValue: 150,
    unit: 'kg'
  },
  other: {
    name: 'Other Waste',
    nameTamil: 'மற்ற கழிவு',
    nameHindi: 'अन्य अपशिष्ट',
    nameTelugu: ' ఇతర',
    compostValue: 200,
    biogasValue: 300,
    resaleValue: 100,
    unit: 'quintal'
  }
};

const climateMultipliers = {
  sunny: 1.0,
  rainy: 0.8,
  cloudy: 0.9,
  humid: 1.1
};

const dealerList = [
  { name: 'Green Earth Organic', phone: '9876543210', location: 'Nearby' },
  { name: 'Bio Compost Dealers', phone: '9876543211', location: 'District' },
  { name: 'Agri Waste Buyers', phone: '9876543212', location: 'Taluk' }
];

exports.calculateWaste = async (req, res) => {
  try {
    const { farmerId, wasteType, quantity, climateCondition } = req.body;

    const wasteInfo = wasteValues[wasteType];
    if (!wasteInfo) {
      return res.status(400).json({ message: 'Invalid waste type' });
    }

    const multiplier = climateMultipliers[climateCondition] || 1.0;

    const compostIncome = Math.round(wasteInfo.compostValue * quantity * multiplier);
    const biogasIncome = Math.round(wasteInfo.biogasValue * quantity * multiplier);
    const resaleIncome = Math.round(wasteInfo.resaleValue * quantity * multiplier);

    const incomes = [
      { method: 'Compost', income: compostIncome, description: 'Sell as organic compost' },
      { method: 'Biogas', income: biogasIncome, description: 'Generate biogas for cooking/electricity' },
      { method: 'Resale', income: resaleIncome, description: 'Sell to waste dealers' }
    ];

    const bestOption = incomes.reduce((max, option) => 
      option.income > max.income ? option : max
    );

    const optimizationSuggestions = [];
    if (climateCondition === 'sunny') {
      optimizationSuggestions.push('Dry the waste before composting for better quality');
      optimizationSuggestions.push('Best time for biogas production - high yield expected');
    } else if (climateCondition === 'rainy') {
      optimizationSuggestions.push('Store waste under cover to prevent nutrient loss');
      optimizationSuggestions.push('Compost with covered pits recommended');
    } else if (climateCondition === 'humid') {
      optimizationSuggestions.push('Accelerated decomposition expected');
      optimizationSuggestions.push('Monitor for fungal growth');
    }

    let saved = 0;
    if (farmerId) {
      const fertilizerCost = quantity * 50;
      saved = fertilizerCost;
      
      await WasteLog.create({
        farmerId,
        wasteType,
        quantity,
        estimatedIncome: bestOption.income,
        climateCondition
      });

      await Farmer.findOneAndUpdate(
        { farmerId },
        { $inc: { moneySaved: saved } }
      );
    }

    res.json({
      success: true,
      result: {
        wasteType: wasteInfo.name,
        quantity,
        unit: wasteInfo.unit,
        climateCondition,
        incomes,
        bestOption,
        optimizationSuggestions,
        dealerList,
        moneySaved: saved,
        totalPotentialIncome: bestOption.income
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getWasteHistory = async (req, res) => {
  try {
    const { farmerId } = req.params;
    
    const logs = await WasteLog.find({ farmerId }).sort({ createdAt: -1 });

    const totalIncome = logs.reduce((sum, log) => sum + log.estimatedIncome, 0);

    res.json({
      success: true,
      summary: {
        totalLogs: logs.length,
        totalIncome
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getWasteTypes = async (req, res) => {
  try {
    const types = Object.entries(wasteValues).map(([key, value]) => ({
      key,
      name: value.name,
      unit: value.unit
    }));
    res.json({ success: true, types });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
