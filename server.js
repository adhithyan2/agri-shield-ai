const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');

dotenv.config();

connectDB();

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/farmers', require('./routes/farmerRoutes'));
app.use('/api/villages', require('./routes/villageRoutes'));
app.use('/api/weather', require('./routes/weatherRoutes'));
app.use('/api/crops', require('./routes/cropRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/waste', require('./routes/wasteRoutes'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'AgriShield AI API is running' });
});

app.use(express.static(path.join(__dirname, '../frontend')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`AgriShield AI running at:`);
  console.log(`  Local:   http://localhost:${PORT}`);
  console.log(`  Network: http://${require('os').networkInterfaces()['Wi-Fi']?.[0]?.address || 'localhost'}:${PORT}`);
});
