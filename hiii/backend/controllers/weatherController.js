const axios = require('axios');
const Village = require('../models/Village');

const getWeatherData = async (lat, lon) => {
  const apiKey = process.env.WEATHER_API_KEY;
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
  const response = await axios.get(url);
  return response.data;
};

const getForecastData = async (lat, lon) => {
  const apiKey = process.env.WEATHER_API_KEY;
  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
  const response = await axios.get(url);
  return response.data;
};

const getCoordinates = async (villageCode) => {
  const villageMap = {
    'TNK01': { lat: 11.1271, lon: 78.6569 },
    'TNK02': { lat: 11.6643, lon: 78.1460 },
    'CHN01': { lat: 13.0827, lon: 80.2707 },
    'AP001': { lat: 16.5062, lon: 80.6480 },
    'KL001': { lat: 10.8505, lon: 76.2711 },
    'KA001': { lat: 12.2958, lon: 76.6014 }
  };
  return villageMap[villageCode] || { lat: 11.1271, lon: 78.6569 };
};

exports.getWeather = async (req, res) => {
  try {
    const { villageCode, lat, lon } = req.query;

    let coordinates;
    if (lat && lon) {
      coordinates = { lat: parseFloat(lat), lon: parseFloat(lon) };
    } else if (villageCode) {
      coordinates = await getCoordinates(villageCode);
    } else {
      coordinates = { lat: 11.1271, lon: 78.6569 };
    }

    const weather = await getWeatherData(coordinates.lat, coordinates.lon);

    const riskFactors = [];
    if (weather.main.temp > 38) {
      riskFactors.push({ type: 'heat', level: 'high', message: 'Extreme heat warning' });
    }
    if (weather.main.humidity < 30) {
      riskFactors.push({ type: 'drought', level: 'medium', message: 'Low humidity - drought risk' });
    }
    if (weather.wind.speed > 10) {
      riskFactors.push({ type: 'wind', level: 'medium', message: 'High wind speed' });
    }
    if (weather.rain) {
      riskFactors.push({ type: 'rain', level: 'low', message: 'Rainfall detected' });
    }

    res.json({
      success: true,
      weather: {
        temperature: weather.main.temp,
        humidity: weather.main.humidity,
        rainfall: weather.rain ? weather.rain['1h'] || 0 : 0,
        windSpeed: weather.wind.speed,
        description: weather.weather[0].description,
        icon: weather.weather[0].icon,
        pressure: weather.main.pressure,
        visibility: weather.visibility
      },
      riskFactors,
      location: {
        name: weather.name,
        country: weather.sys.country
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch weather data', error: error.message });
  }
};

exports.getForecast = async (req, res) => {
  try {
    const { villageCode, lat, lon } = req.query;

    let coordinates;
    if (lat && lon) {
      coordinates = { lat: parseFloat(lat), lon: parseFloat(lon) };
    } else if (villageCode) {
      coordinates = await getCoordinates(villageCode);
    } else {
      coordinates = { lat: 11.1271, lon: 78.6569 };
    }

    const forecast = await getForecastData(coordinates.lat, coordinates.lon);

    const hourlyData = forecast.list.slice(0, 8).map(item => ({
      time: item.dt_txt,
      temperature: item.main.temp,
      humidity: item.main.humidity,
      rainfall: item.rain ? item.rain['3h'] || 0 : 0,
      windSpeed: item.wind.speed,
      description: item.weather[0].description,
      icon: item.weather[0].icon
    }));

    const dailyData = [];
    for (let i = 0; i < forecast.list.length; i += 8) {
      const day = forecast.list[i];
      dailyData.push({
        date: day.dt_txt,
        temp: day.main.temp,
        humidity: day.main.humidity,
        rainfall: day.rain ? day.rain['3h'] || 0 : 0,
        description: day.weather[0].description,
        icon: day.weather[0].icon
      });
    }

    res.json({
      success: true,
      hourly: hourlyData,
      daily: dailyData.slice(0, 5)
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch forecast data', error: error.message });
  }
};
