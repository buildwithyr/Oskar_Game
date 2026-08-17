// einmalig verwendet, nicht Teil vom Build/Spiel
// Generiert das App-Icon (Squircle, Sonnen-Gradient, Oskar-Cartoon) als PNG.
// Pure Node.js, keine Dependencies: eigener minimaler PNG-Decoder (fuer
// assets/OskarCartoon.png) und -Encoder (zlib ist Node-Bordmittel).
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

/* ══════════════════════════════════════
   PNG: CRC / CHUNKS
══════════════════════════════════════ */

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
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

/* ══════════════════════════════════════
   PNG DECODER (8-bit RGBA/RGB, kein Interlace)
   Reicht fuer unsere eigenen Asset-PNGs.
══════════════════════════════════════ */

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

function readPNG(filePath) {
  const buf = fs.readFileSync(filePath);
  let pos = 8; // skip signature
  let width = 0, height = 0, bitDepth = 0, colorType = 0, interlace = 0;
  const idatChunks = [];

  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);

    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
      interlace = data[12];
    } else if (type === 'IDAT') {
      idatChunks.push(data);
    }

    pos += 8 + len + 4;
    if (type === 'IEND') break;
  }

  if (bitDepth !== 8 || interlace !== 0 || (colorType !== 6 && colorType !== 2)) {
    throw new Error(`${filePath}: nur 8-bit, nicht-interlaced RGB/RGBA PNGs werden unterstuetzt`);
  }

  const channels = colorType === 6 ? 4 : 3;
  const raw = zlib.inflateSync(Buffer.concat(idatChunks));
  const stride = width * channels;
  const out = new Uint8ClampedArray(width * height * 4);
  let prevRow = new Uint8ClampedArray(stride);

  for (let y = 0; y < height; y++) {
    const filterType = raw[y * (stride + 1)];
    const rowStart = y * (stride + 1) + 1;
    const row = new Uint8ClampedArray(stride);

    for (let x = 0; x < stride; x++) {
      const bpp = channels;
      const raw8 = raw[rowStart + x];
      const a = x >= bpp ? row[x - bpp] : 0;
      const b = prevRow[x];
      const c = x >= bpp ? prevRow[x - bpp] : 0;
      let val;
      switch (filterType) {
        case 0: val = raw8; break;
        case 1: val = raw8 + a; break;
        case 2: val = raw8 + b; break;
        case 3: val = raw8 + Math.floor((a + b) / 2); break;
        case 4: val = raw8 + paeth(a, b, c); break;
        default: throw new Error(`Unbekannter PNG-Filtertyp ${filterType}`);
      }
      row[x] = val & 0xFF;
    }

    for (let x = 0; x < width; x++) {
      const si = x * channels;
      const di = (y * width + x) * 4;
      out[di] = row[si];
      out[di + 1] = row[si + 1];
      out[di + 2] = row[si + 2];
      out[di + 3] = channels === 4 ? row[si + 3] : 255;
    }

    prevRow = row;
  }

  return { width, height, pixels: out };
}

/* ══════════════════════════════════════
   PNG ENCODER (8-bit RGBA)
══════════════════════════════════════ */

function writePNG(rgba, size) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type: RGBA
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  const raw = Buffer.alloc(size * (1 + size * 4));
  for (let y = 0; y < size; y++) {
    const rowStart = y * (1 + size * 4);
    raw[rowStart] = 0; // filter: None
    raw.set(rgba.subarray(y * size * 4, (y + 1) * size * 4), rowStart + 1);
  }
  const compressed = zlib.deflateSync(raw, { level: 9 });

  return Buffer.concat([
    sig,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', Buffer.alloc(0)),
  ]);
}

/* ══════════════════════════════════════
   HILFSFUNKTIONEN: FARBE / RESIZE / BLEND
══════════════════════════════════════ */

function hex(h) {
  const n = parseInt(h.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function lerp(a, b, t) { return a + (b - a) * t; }

function lerpColor(c1, c2, t) {
  return [lerp(c1[0], c2[0], t), lerp(c1[1], c2[1], t), lerp(c1[2], c2[2], t)];
}

// Box-Filter Downscale (gute Qualitaet fuer 1024 -> Icon-Groesse)
function resizeBox(src, sw, sh, dw, dh) {
  const dst = new Uint8ClampedArray(dw * dh * 4);
  for (let dy = 0; dy < dh; dy++) {
    const sy0 = Math.floor((dy * sh) / dh);
    const sy1 = Math.max(sy0 + 1, Math.floor(((dy + 1) * sh) / dh));
    for (let dx = 0; dx < dw; dx++) {
      const sx0 = Math.floor((dx * sw) / dw);
      const sx1 = Math.max(sx0 + 1, Math.floor(((dx + 1) * sw) / dw));
      let r = 0, g = 0, b = 0, a = 0, count = 0;
      for (let sy = sy0; sy < sy1; sy++) {
        for (let sx = sx0; sx < sx1; sx++) {
          const i = (sy * sw + sx) * 4;
          r += src[i]; g += src[i + 1]; b += src[i + 2]; a += src[i + 3];
          count++;
        }
      }
      const j = (dy * dw + dx) * 4;
      dst[j] = r / count; dst[j + 1] = g / count; dst[j + 2] = b / count; dst[j + 3] = a / count;
    }
  }
  return dst;
}

function blendPixel(dst, size, x, y, r, g, b, a) {
  if (x < 0 || x >= size || y < 0 || y >= size || a <= 0) return;
  const i = (y * size + x) * 4;
  const srcA = a / 255, dstA = dst[i + 3] / 255;
  const outA = srcA + dstA * (1 - srcA);
  if (outA < 0.001) return;
  dst[i]     = Math.round((r * srcA + dst[i]     * dstA * (1 - srcA)) / outA);
  dst[i + 1] = Math.round((g * srcA + dst[i + 1] * dstA * (1 - srcA)) / outA);
  dst[i + 2] = Math.round((b * srcA + dst[i + 2] * dstA * (1 - srcA)) / outA);
  dst[i + 3] = Math.round(outA * 255);
}

/* ══════════════════════════════════════
   ICON BAUEN
══════════════════════════════════════ */

// Eckenradius: interpoliert zwischen den vorgegebenen Ankerpunkten
// (512 -> 40, 192 -> 27, 88 -> 20), darunter extrapoliert.
function cornerRadius(size) {
  if (size >= 512) return 40 * (size / 512);
  if (size >= 192) return lerp(27, 40, (size - 192) / (512 - 192));
  if (size >= 88) return lerp(20, 27, (size - 88) / (192 - 88));
  const slope = (27 - 20) / (192 - 88);
  return Math.max(size * 0.22, 20 - slope * (88 - size));
}

function buildIcon(size, oskarSrc) {
  const buf = new Uint8ClampedArray(size * size * 4);

  // 1) Gradient-Hintergrund: 160deg, #F3C24E 0% -> #E8763A 55% -> #D65A2E 100%
  const c0 = hex('#F3C24E'), c1 = hex('#E8763A'), c2 = hex('#D65A2E');
  const angle = (160 * Math.PI) / 180;
  const dx = Math.sin(angle), dy = -Math.cos(angle);
  const corners = [[0, 0], [size, 0], [0, size], [size, size]];
  let pMin = Infinity, pMax = -Infinity;
  for (const [cx, cy] of corners) {
    const p = cx * dx + cy * dy;
    if (p < pMin) pMin = p;
    if (p > pMax) pMax = p;
  }

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const p = x * dx + y * dy;
      const t = (p - pMin) / (pMax - pMin);
      const col = t <= 0.55 ? lerpColor(c0, c1, t / 0.55) : lerpColor(c1, c2, (t - 0.55) / 0.45);
      const i = (y * size + x) * 4;
      buf[i] = col[0]; buf[i + 1] = col[1]; buf[i + 2] = col[2]; buf[i + 3] = 255;
    }
  }

  // 2) Sonnenscheibe oben rechts: radial-gradient(#FFF3C6 -> #F2C14E -> #E9A83A)
  const sunC = size * 0.76, sunCy = size * 0.22, sunR = size * 0.22;
  const sc0 = hex('#FFF3C6'), sc1 = hex('#F2C14E'), sc2 = hex('#E9A83A');
  const sy0 = Math.max(0, Math.floor(sunCy - sunR * 1.3));
  const sy1 = Math.min(size, Math.ceil(sunCy + sunR * 1.3));
  const sx0 = Math.max(0, Math.floor(sunC - sunR * 1.3));
  const sx1 = Math.min(size, Math.ceil(sunC + sunR * 1.3));
  for (let y = sy0; y < sy1; y++) {
    for (let x = sx0; x < sx1; x++) {
      const d = Math.sqrt((x - sunC) ** 2 + (y - sunCy) ** 2) / sunR;
      if (d > 1.15) continue;
      const t = Math.min(1, d);
      const col = t <= 0.58 ? lerpColor(sc0, sc1, t / 0.58) : lerpColor(sc1, sc2, (t - 0.58) / 0.42);
      const alpha = d <= 1 ? 255 : Math.max(0, 255 * (1.15 - d) / 0.15);
      blendPixel(buf, size, x, y, col[0], col[1], col[2], alpha);
    }
  }

  // 3) Oskar-Cartoon: unten auf dem Rand "sitzend" (leicht ueberstehend)
  const oskarW = Math.round(size * 0.86);
  const resized = resizeBox(oskarSrc.pixels, oskarSrc.width, oskarSrc.height, oskarW, oskarW);
  const offsetBottom = size * (6 / 512);
  const startX = Math.round((size - oskarW) / 2);
  const startY = Math.round(size + offsetBottom - oskarW);
  for (let y = 0; y < oskarW; y++) {
    const dy2 = startY + y;
    if (dy2 < 0 || dy2 >= size) continue;
    for (let x = 0; x < oskarW; x++) {
      const dx2 = startX + x;
      if (dx2 < 0 || dx2 >= size) continue;
      const i = (y * oskarW + x) * 4;
      blendPixel(buf, size, dx2, dy2, resized[i], resized[i + 1], resized[i + 2], resized[i + 3]);
    }
  }

  // 4) Top-Highlight (entspricht inset 0 3px 3px rgba(255,255,255,.4))
  const highlightBand = size * 0.05;
  for (let y = 0; y < highlightBand; y++) {
    const alpha = 255 * 0.4 * (1 - y / highlightBand);
    for (let x = 0; x < size; x++) blendPixel(buf, size, x, y, 255, 255, 255, alpha);
  }

  // 5) Squircle-Maske (abgerundetes Quadrat) mit weicher Kante
  const r = cornerRadius(size);
  const out = new Uint8ClampedArray(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const cx = Math.abs(x - size / 2) - (size / 2 - r);
      const cy = Math.abs(y - size / 2) - (size / 2 - r);
      let alphaMul = 1;
      if (cx > 0 && cy > 0) {
        const d = Math.sqrt(cx * cx + cy * cy);
        if (d > r) alphaMul = 0;
        else if (d > r - 1.5) alphaMul = (r - d) / 1.5;
      }
      const i = (y * size + x) * 4;
      out[i] = buf[i]; out[i + 1] = buf[i + 1]; out[i + 2] = buf[i + 2];
      out[i + 3] = buf[i + 3] * alphaMul;
    }
  }

  return out;
}

/* ══════════════════════════════════════
   RUN
══════════════════════════════════════ */

const assetsDir = path.join(__dirname, '..', 'assets');
const iconsDir = path.join(__dirname, '..', 'icons');
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir);

const oskarSrc = readPNG(path.join(assetsDir, 'OskarCartoon.png'));

const targets = [
  { file: 'icon-512.png', size: 512 },
  { file: 'icon-192.png', size: 192 },
  { file: 'apple-touch-icon.png', size: 180 },
  { file: 'favicon.png', size: 32 },
];

for (const { file, size } of targets) {
  const pixels = buildIcon(size, oskarSrc);
  fs.writeFileSync(path.join(iconsDir, file), writePNG(pixels, size));
  console.log(`✅ icons/${file} erstellt (${size}×${size})`);
}
