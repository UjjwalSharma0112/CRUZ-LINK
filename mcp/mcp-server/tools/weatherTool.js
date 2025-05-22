// File: tools/weatherTool.js
// Weather tool using OpenWeather API with backward compatibility for old function names

const axios = require('axios');

const name = 'weather';

// Use your OpenWeather API key from https://openweathermap.org/api
const API_KEY = process.env.OPENWEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

const actions = {
  // Get current weather by city, IP (not supported), or lat/lon
  async getCurrentWeather(params = {}) {
    if (!params.location) {
      throw new Error('Location parameter is required (e.g., city name or "lat,lon")');
    }

    let queryParam;
    if (params.location.includes(',')) {
      queryParam = { lat: params.location.split(',')[0], lon: params.location.split(',')[1] };
    } else {
      queryParam = { q: params.location };
    }

    try {
      const response = await axios.get(`${BASE_URL}/weather`, {
        params: {
          ...queryParam,
          appid: API_KEY,
          units: 'metric'
        }
      });
     

      return response.data;
    } catch (error) {
      console.error('OpenWeather API error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'OpenWeather API request failed');
    }
  },

  async getCurrentByCity(params = {}) {
    return this.getCurrentWeather({
      location: params.city
    });
  },

  async getCurrentByCoords(params = {}) {
    if (!params.lat || !params.lon) {
      throw new Error('Latitude and longitude parameters are required');
    }

    return this.getCurrentWeather({
      location: `${params.lat},${params.lon}`
    });
  },

  // Get weather forecast by city or lat/lon
  async getForecast(params = {}) {
    if (!params.location) {
      throw new Error('Location parameter is required');
    }

    let queryParam;
    if (params.location.includes(',')) {
      queryParam = { lat: params.location.split(',')[0], lon: params.location.split(',')[1] };
    } else {
      queryParam = { q: params.location };
    }

    try {
      const response = await axios.get(`${BASE_URL}/forecast`, {
        params: {
          ...queryParam,
          appid: API_KEY,
          units: 'metric',
          cnt: (params.days || 3) * 8 // 8 entries per day (3h intervals)
        }
      });

      return response.data;
    } catch (error) {
      console.error('OpenWeather Forecast error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'OpenWeather forecast request failed');
    }
  },

  async getForecastByCity(params = {}) {
    return this.getForecast({
      location: params.city,
      days: params.days || 5
    });
  },

  async searchLocations(params = {}) {
    if (!params.query) {
      throw new Error('Query parameter is required');
    }

    try {
      const response = await axios.get(`http://api.openweathermap.org/geo/1.0/direct`, {
        params: {
          q: params.query,
          limit: 5,
          appid: API_KEY
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('OpenWeather search error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Location search failed');
    }
  },

  async getAstronomy(params = {}) {
    throw new Error('OpenWeather API does not support astronomy data like sunrise/sunset directly. Consider using One Call API.');
  }
};

module.exports = {
  name,
  actions
};
