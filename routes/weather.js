const express = require('express');
const router = express.Router();
const axios = require('axios');

// ✅ Replace with your actual WeatherAPI key
const WEATHER_API_KEY = '893acfd151d94bc8b4a150728250307';

// ✅ Known cities in Maharashtra for validation
const validCities = [
  'mumbai', 'pune', 'nagpur', 'nashik', 'aurangabad', 'solapur', 'amravati', 'kolhapur',
  'nanded', 'sangli', 'jalgaon', 'akola', 'latur', 'dhule', 'ahmednagar', 'chandrapur',
  'parbhani', 'beed', 'ratnagiri', 'wardha', 'satara', 'buldhana', 'yavatmal', 'osmanabad',
  'jalna', 'hingoli', 'gondia', 'nashik', 'thane', 'raigad', 'palghar', 'washim'
];

router.get('/', (req, res) => {
  res.render('weather', { weather: null, forecast: null, sowingAdvice: null, error: null });
});

router.post('/', async (req, res) => {
  const cityInput = req.body.city?.trim().toLowerCase();
  const crop = req.body.crop?.trim().toLowerCase();

  if (!cityInput) {
    return res.render('weather', {
      weather: null,
      forecast: null,
      sowingAdvice: null,
      error: 'Please enter a city name.'
    });
  }

  // ✅ Validate city
  const matchedCity = validCities.find(c => c.toLowerCase() === cityInput);
  if (!matchedCity) {
    return res.render('weather', {
      weather: null,
      forecast: null,
      sowingAdvice: null,
      error: 'Invalid city name. Please enter a valid city in Maharashtra.'
    });
  }

  try {
    const response = await axios.get('http://api.weatherapi.com/v1/forecast.json', {
      params: {
        key: WEATHER_API_KEY,
        q: `${matchedCity},Maharashtra`,
        days: 3,
        aqi: 'no',
        alerts: 'no'
      }
    });

    const data = response.data;

    const weather = {
      city: data.location.name,
      description: data.current.condition.text,
      temp: data.current.temp_c,
      humidity: data.current.humidity,
      wind: data.current.wind_kph,
      rain: data.current.precip_mm
    };

    const forecast = data.forecast.forecastday.map(day => ({
      date: day.date,
      condition: day.day.condition.text,
      avgTemp: day.day.avgtemp_c,
      maxTemp: day.day.maxtemp_c,
      minTemp: day.day.mintemp_c,
      rain: day.day.totalprecip_mm,
      humidity: day.day.avghumidity
    }));

    // ✅ If crop is selected, call Flask sowing advice
    let sowingAdvice = null;
    if (crop) {
      try {
        const sowingRes = await axios.post('http://localhost:5001/sowing-advice', {
          crop,
          forecast
        });
        sowingAdvice = sowingRes.data.advice;
      } catch (sowError) {
        console.error('Sowing advice error:', sowError.message);
        sowingAdvice = null;
      }
    }

    res.render('weather', { weather, forecast, sowingAdvice, error: null });

  } catch (error) {
    console.error('Weather API error:', error.message);
    res.render('weather', {
      weather: null,
      forecast: null,
      sowingAdvice: null,
      error: 'Unable to fetch weather data. Please try again later.'
    });
  }
});

// API endpoint for getting current weather
router.post('/api/get-weather', async (req, res) => {
  try {
    const { location } = req.body;
    
    if (!location) {
      return res.status(400).json({ message: 'Location is required' });
    }

    const response = await axios.get('http://api.weatherapi.com/v1/current.json', {
      params: {
        key: WEATHER_API_KEY,
        q: location,
        aqi: 'no'
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Weather API error:', error.message);
    res.status(500).json({ message: 'Unable to fetch weather data' });
  }
});

// API endpoint for getting weather forecast
router.post('/api/get-forecast', async (req, res) => {
  try {
    const { location } = req.body;
    
    if (!location) {
      return res.status(400).json({ message: 'Location is required' });
    }

    const response = await axios.get('http://api.weatherapi.com/v1/forecast.json', {
      params: {
        key: WEATHER_API_KEY,
        q: location,
        days: 4,
        aqi: 'no',
        alerts: 'no'
      }
    });

    // Format the data to match what the frontend expects
    const forecast = response.data.forecast.forecastday.map(day => ({
      dt: new Date(day.date).getTime() / 1000, // Convert to Unix timestamp
      main: {
        temp: day.day.avgtemp_c
      },
      weather: [{
        main: day.day.condition.text.includes('rain') ? 'Rain' : 
              day.day.condition.text.includes('cloud') ? 'Clouds' : 'Clear',
        description: day.day.condition.text,
        icon: day.day.condition.icon.replace('//cdn.weatherapi.com', '')
      }]
    }));

    res.json(forecast);
  } catch (error) {
    console.error('Forecast API error:', error.message);
    res.status(500).json({ message: 'Unable to fetch forecast data' });
  }
});

module.exports = router;
