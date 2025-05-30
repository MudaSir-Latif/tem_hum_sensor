const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
const corsOptions = { origin: '*' };
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB Connection
(async () => {
  try {
    await mongoose.connect('mongodb+srv://mudassir_123:mudassir_123@cluster0.efhemjl.mongodb.net/sensor_data?retryWrites=true&w=majority', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1); // Exit the process if the connection fails
  }
})();
const sensorSchema = new mongoose.Schema({
  temperature: Number,
  humidity: Number,
  timestamp: { type: Date, default: Date.now }
});
const SensorData = mongoose.models.SensorData || mongoose.model('SensorData', sensorSchema);

// Firmware directory (Vercel needs writable path)
const firmwareDir = '/tmp'; //  ephemeral storage
let firmwareVersion = '1.0.0';

// Ensure /tmp exists (redundant but harmless)
if (!fs.existsSync(firmwareDir)) {
  fs.mkdirSync(firmwareDir);
}

// Save sensor data
app.post('/data', async (req, res) => {
  try {
    const data = new SensorData(req.body);
    await data.save();
    res.status(201).send('Data saved');
  } catch (error) {
    console.error('Error saving data:', error);
    res.status(500).send('Error saving data');
  }
});

// Get sensor data
app.get('/data', async (req, res) => {
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

// Serve firmware binary
app.get('/ota', (req, res) => {
  const firmwarePath = path.join(firmwareDir, 'esp32_firmware.bin');

  if (fs.existsSync(firmwarePath)) {
    const stats = fs.statSync(firmwarePath);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Content-Disposition', 'attachment; filename="esp32_firmware.bin"');
    const readStream = fs.createReadStream(firmwarePath);
    readStream.pipe(res);
    console.log('Firmware sent to device');
  } else {
    console.error('Firmware not found at', firmwarePath);
    res.status(404).send('Firmware not found');
  }
});

// Firmware metadata
app.get('/ota-metadata', (req, res) => {
  const firmwarePath = path.join(firmwareDir, 'esp32_firmware.bin');
  const exists = fs.existsSync(firmwarePath);

  res.json({
    version: firmwareVersion,
    url: `/ota`,
    exists,
    size: exists ? fs.statSync(firmwarePath).size : 0
  });
});

// Upload firmware
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, firmwareDir),
  filename: (req, file, cb) => cb(null, 'esp32_firmware.bin'),
});
const upload = multer({ storage });

app.post('/upload', upload.single('firmware'), (req, res) => {
  try {
    if (req.body.version) {
      firmwareVersion = req.body.version;
    }
    console.log(` Firmware uploaded: ${req.file.originalname}, Version: ${firmwareVersion}`);
    res.send('<script>alert("Firmware uploaded successfully"); setTimeout(() => { window.location.href = "/"; }, 1000);</script>');
  } catch (error) {
    console.error('Error uploading firmware:', error);
    res.status(500).send('<script>alert("Error uploading firmware"); setTimeout(() => { window.location.href = "/"; }, 1000);</script>');
  }
});

// Serve upload page
app.get('/upload.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'upload.html'));
});

// Serve home page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

module.exports = app;
