const express = require('express');
const multer = require('multer');
const path = require('path');

const router = express.Router();
const firmwareDir = path.join(__dirname, '../firmware');
let firmwareVersion = '1.0.0';

// Upload firmware
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, firmwareDir),
  filename: (req, file, cb) => cb(null, 'esp32_firmware.bin')
});
const upload = multer({ storage });

router.post('/upload', upload.single('firmware'), (req, res) => {
  try {
    if (req.body.version) {
      firmwareVersion = req.body.version;
    }
    console.log(`Firmware uploaded: ${req.file.originalname}, Version: ${firmwareVersion}`);
    res.send('Firmware uploaded successfully');
  } catch (error) {
    console.error('Error uploading firmware:', error);
    res.status(500).send('Error uploading firmware');
  }
});

// Serve firmware metadata
router.get('/ota-metadata', (req, res) => {
  const firmwarePath = path.join(firmwareDir, 'esp32_firmware.bin');
  const exists = fs.existsSync(firmwarePath);

  res.json({
    version: firmwareVersion,
    url: `http://localhost:3000/ota`,
    exists,
    size: exists ? fs.statSync(firmwarePath).size : 0
  });
});

module.exports = router;