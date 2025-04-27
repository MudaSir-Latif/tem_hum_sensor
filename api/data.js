const express = require('express');
const SensorData = require('../models/SensorData');
const router = express.Router();

// Save sensor data
router.post('/data', async (req, res) => {
  try {
    const data = new SensorData(req.body);
    await data.save();
    res.status(201).send('Data saved');
  } catch (error) {
    console.error('Error saving data:', error);
    res.status(500).send('Error saving data');
  }
});

// Get sensor data (optionally filtered by date)
router.get('/data', async (req, res) => {
  try {
    const { date } = req.query;
    let query = {};

    if (date) {
      const parsedDate = new Date(date);

      if (!isNaN(parsedDate.getTime())) {
        const start = new Date(parsedDate);
        start.setHours(0, 0, 0, 0);

        const end = new Date(parsedDate);
        end.setHours(23, 59, 59, 999);

        query.timestamp = { $gte: start, $lte: end };
      } else {
        return res.status(400).send('Invalid date format');
      }
    }

    const records = await SensorData.find(query).sort({ timestamp: -1 });
    res.json(records);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).send('Error fetching data');
  }
});

module.exports = router;