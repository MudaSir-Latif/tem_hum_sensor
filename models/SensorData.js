const mongoose = require('mongoose');

const sensorSchema = new mongoose.Schema({
  temperature: Number,
  humidity: Number,
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SensorData', sensorSchema);