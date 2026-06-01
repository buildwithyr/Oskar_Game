// Minimal PNG generator using Node.js built-in zlib
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

// CRC32 table for PNG chunks
const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) crc = crcTable[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length);
  const crcInput = Buffer.concat([typeBuf, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(crcInput));
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function createPNG(size) {
  // Draw a warm coral/beach gradient icon
  // Background: coral #F4845F -> warm peach #FFD8B0
  // Circle with paw print shape

  const rawData = [];

  for (let y = 0; y < size; y++) {
    rawData.push(0); // filter type: None
    for (let x = 0; x < size; x++) {
      const cx = x - size / 2;
      const cy = y - size / 2;
      const dist = Math.sqrt(cx * cx + cy * cy);
      const maxR = size / 2;

      // Gradient: top-left #FF8C42 -> bottom-right #FFD8B0
      const t = (x + y) / (size * 2);
      let r = Math.round(244 + (255 - 244) * t);  // 244 -> 255
      let g = Math.round(132 + (216 - 132) * t);  // 132 -> 216
      let b = Math.round(95 + (176 - 95) * t);    // 95 -> 176

      // Soft edge circle (rounded corners effect)
      const cornerR = size * 0.2;
      let alpha = 255;

      // Check if outside rounded rect
      const rx = Math.abs(cx) - (maxR - cornerR);
      const ry = Math.abs(cy) - (maxR - cornerR);
      if (rx > 0 && ry > 0) {
        const cornerDist = Math.sqrt(rx * rx + ry * ry);
        if (cornerDist > cornerR) alpha = 0;
        else if (cornerDist > cornerR - 2) alpha = Math.round(255 * (cornerR - cornerDist) / 2);
      }

      // White paw print in center
      const relX = cx / maxR;
      const relY = cy / maxR;

      // Main paw pad (large oval bottom center)
      const pawDist = Math.sqrt((relX) ** 2 + (relY - 0.2) ** 2 * 1.5);
      if (pawDist < 0.28) { r = 255; g = 255; b = 255; }

      // 3 toe pads top
      const toe1 = Math.sqrt((relX + 0.25) ** 2 + (relY + 0.1) ** 2);
      const toe2 = Math.sqrt((relX) ** 2 + (relY + 0.22) ** 2);
      const toe3 = Math.sqrt((relX - 0.25) ** 2 + (relY + 0.1) ** 2);
      if (toe1 < 0.14 || toe2 < 0.14 || toe3 < 0.14) { r = 255; g = 255; b = 255; }

      rawData.push(r, g, b, alpha);
    }
  }

  const rawBuf = Buffer.from(rawData);
  const compressed = zlib.deflateSync(rawBuf, { level: 9 });

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(size, 0);   // width
  ihdrData.writeUInt32BE(size, 4);   // height
  ihdrData[8] = 8;  // bit depth
  ihdrData[9] = 6;  // color type: RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace

  const png = Buffer.concat([
    sig,
    makeChunk('IHDR', ihdrData),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', Buffer.alloc(0))
  ]);

  return png;
}

const iconsDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir);

fs.writeFileSync(path.join(iconsDir, 'icon-192.png'), createPNG(192));
fs.writeFileSync(path.join(iconsDir, 'icon-512.png'), createPNG(512));
fs.writeFileSync(path.join(iconsDir, 'apple-touch-icon.png'), createPNG(180));
fs.writeFileSync(path.join(iconsDir, 'favicon.png'), createPNG(32));

console.log('Icons generated successfully!');
