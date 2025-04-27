import path from 'path';
import { promises as fs } from 'fs';

export default async function handler(req, res) {
  const firmwarePath = path.join(process.cwd(), 'firmware', 'esp32_firmware.bin'); // if moved to public
  try {
    const file = await fs.readFile(firmwarePath);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', 'attachment; filename="esp32_firmware.bin"');
    res.send(file);
  } catch (error) {
    console.error(error);
    res.status(500).send('Firmware not found');
  }
}
