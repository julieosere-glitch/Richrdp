const express = require('express');
const axios = require('axios');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Mock OANDA API client implementation since the official package isn't available
class OandaClient {
  constructor() {
    this.accessToken = process.env.OANDA_API_KEY;
    this.accountId = process.env.OANDA_ACCOUNT_ID;
    this.environment = process.env.OANDA_ENVIRONMENT || 'practice';
    
    // Determine base URL based on environment
    this.baseUrl = this.environment === 'live' 
      ? 'https://api-fxtrade.oanda.com'
      : 'https://api-fxpractice.oanda.com';
    
    this.headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.accessToken}`
    };
  }

  // Get account details
  async getAccountDetails() {
    try {
      const response = await axios.get(
        `${this.baseUrl}/v3/accounts/${this.accountId}`,
        { headers: this.headers }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching account details:', error.response?.data || error.message);
      throw error;
    }
  }

  // Get pricing for instruments
  async getPricing(instruments) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/v3/accounts/${this.accountId}/pricing`,
        {
          headers: this.headers,
          params: {
            instruments: instruments.join(',')
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching pricing:', error.response?.data || error.message);
      throw error;
    }
  }

  // Get historical data (candles)
  async getCandles(instrument, granularity = 'H1', count = 500) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/v3/instruments/${instrument}/candles`,
        {
          headers: this.headers,
          params: {
            granularity,
            count
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching candles:', error.response?.data || error.message);
      throw error;
    }
  }

  // Get list of tradeable instruments
  async getInstruments() {
    try {
      const response = await axios.get(
        `${this.baseUrl}/v3/accounts/${this.accountId}/instruments`,
        { headers: this.headers }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching instruments:', error.response?.data || error.message);
      throw error;
    }
  }
}

// Initialize OANDA client
const oandaClient = new OandaClient();

// Routes
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// Get account information
app.get('/api/account', async (req, res) => {
  try {
    const accountData = await oandaClient.getAccountDetails();
    res.json(accountData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch account data' });
  }
});

// Get current pricing for instruments
app.get('/api/pricing', async (req, res) => {
  try {
    const instruments = req.query.instruments ? req.query.instruments.split(',') : ['EUR_USD'];
    const pricingData = await oandaClient.getPricing(instruments);
    res.json(pricingData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch pricing data' });
  }
});

// Get historical data (candles)
app.get('/api/candles/:instrument', async (req, res) => {
  try {
    const { instrument } = req.params;
    const { granularity, count } = req.query;
    
    const candleData = await oandaClient.getCandles(
      instrument,
      granularity || 'H1',
      parseInt(count) || 500
    );
    
    res.json(candleData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch candle data' });
  }
});

// Get available instruments
app.get('/api/instruments', async (req, res) => {
  try {
    const instrumentsData = await oandaClient.getInstruments();
    res.json(instrumentsData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch instruments' });
  }
});

// Get news data (placeholder - would integrate with news API)
app.get('/api/news', async (req, res) => {
  // In a real implementation, this would connect to a news API
  // For now, we'll return mock data
  res.json({
    status: 'success',
    articles: [
      {
        title: 'Market Update: EUR/USD Shows Strong Momentum',
        description: 'The EUR/USD pair has shown strong momentum today amid positive economic indicators.',
        publishedAt: '2026-02-19T10:00:00Z',
        source: 'Financial Times'
      },
      {
        title: 'Cryptocurrency Markets Volatile After Regulatory Announcement',
        description: 'Major cryptocurrencies experience volatility following new regulatory guidelines.',
        publishedAt: '2026-02-19T09:30:00Z',
        source: 'Bloomberg'
      }
    ]
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Trading Analysis Platform server running on port ${PORT}`);
});