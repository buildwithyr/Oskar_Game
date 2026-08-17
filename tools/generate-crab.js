// Generiert einen Cartoon-Krebs als sauberes RGBA-PNG (keine Libs nötig)
const zlib = require('zlib');
const fs   = require('fs');

const SIZE = 400;
const buf  = new Uint8Array(SIZE * SIZE * 4); // RGBA, alles transparent

/* ── PNG-Infrastruktur ─────────────────────────────── */
const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();
function crc32(b) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < b.length; i++) c = crcTable[(c ^ b[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}
function chunk(type, data) {
  const tb = Buffer.from(type, 'ascii');
  const lb = Buffer.alloc(4); lb.writeUInt32BE(data.length);
  const cb = Buffer.alloc(4); cb.writeUInt32BE(crc32(Buffer.concat([tb, data])));
  return Buffer.concat([lb, tb, data, cb]);
}
function toPNG(rgba, size) {
  const sig  = Buffer.from([137,80,78,71,13,10,26,10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8]=8; ihdr[9]=6; // 8-bit RGBA
  const raw = [];
  for (let y = 0; y < size; y++) {
    raw.push(0); // filter None
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      raw.push(rgba[i], rgba[i+1], rgba[i+2], rgba[i+3]);
    }
  }
  const compressed = zlib.deflateSync(Buffer.from(raw), { level: 9 });
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', compressed), chunk('IEND', Buffer.alloc(0))]);
}

/* ── Zeichenfunktionen ─────────────────────────────── */
function blend(x, y, r, g, b, a) {
  if (x < 0 || x >= SIZE || y < 0 || y >= SIZE || a <= 0) return;
  const i = (y * SIZE + x) * 4;
  const srcA = a / 255, dstA = buf[i+3] / 255;
  const outA = srcA + dstA * (1 - srcA);
  if (outA < 0.001) return;
  buf[i]   = Math.round((r * srcA + buf[i]   * dstA * (1-srcA)) / outA);
  buf[i+1] = Math.round((g * srcA + buf[i+1] * dstA * (1-srcA)) / outA);
  buf[i+2] = Math.round((b * srcA + buf[i+2] * dstA * (1-srcA)) / outA);
  buf[i+3] = Math.round(outA * 255);
}

// Rotierte Ellipse: gibt normierte Distanz zurück (<=1 = innen)
function ellDist(x, y, cx, cy, rx, ry, angle = 0) {
  const cos = Math.cos(angle), sin = Math.sin(angle);
  const dx = x - cx, dy = y - cy;
  const lx = cos * dx + sin * dy, ly = -sin * dx + cos * dy;
  return (lx/rx)**2 + (ly/ry)**2;
}

function fillEllipse(cx, cy, rx, ry, angle, r, g, b, alpha = 255) {
  const pad = 2;
  for (let y = Math.floor(cy-ry-pad); y <= Math.ceil(cy+ry+pad); y++) {
    for (let x = Math.floor(cx-rx-pad); x <= Math.ceil(cx+rx+pad); x++) {
      const d = ellDist(x, y, cx, cy, rx, ry, angle);
      if (d <= 1)      blend(x, y, r, g, b, alpha);
      else if (d < 1.04) blend(x, y, r, g, b, Math.round(alpha * (1.04-d) / 0.04));
    }
  }
}

// Kontur einer Ellipse (Outline)
function strokeEllipse(cx, cy, rx, ry, angle, thick, r, g, b) {
  const outerR = rx + thick, outerRy = ry + thick;
  const innerR = rx - thick, innerRy = ry - thick;
  const pad = thick + 2;
  for (let y = Math.floor(cy-outerRy-pad); y <= Math.ceil(cy+outerRy+pad); y++) {
    for (let x = Math.floor(cx-outerR-pad); x <= Math.ceil(cx+outerR+pad); x++) {
      const dOut = ellDist(x, y, cx, cy, outerR, outerRy, angle);
      const dIn  = ellDist(x, y, cx, cy, Math.max(1,innerR), Math.max(1,innerRy), angle);
      if (dOut <= 1 && dIn >= 1) {
        const edge = Math.min(1 - dOut, dIn - 1) / 0.04;
        blend(x, y, r, g, b, Math.min(255, Math.round(255 * edge + 200)));
      }
    }
  }
}

/* ── Krebs zeichnen ────────────────────────────────── */
// Farben
const RED   = [218,  30,  30];  // Körper
const DRED  = [150,  10,  10];  // Outline / Schatten
const LRED  = [255,  90,  90];  // Glanzlicht
const CREAM = [255, 238, 130];  // Augen
const BLACK = [ 20,  15,  15];  // Pupillen
const WHITE = [255, 255, 255];  // Glanzpunkte

// Koordinaten (400x400 canvas, Krebs zentriert)
const CX = 200, CY = 230;  // Körpermitte

// 1. Scheren (hinter dem Körper, zuerst zeichnen)
// Linke Schere
fillEllipse(82, 130, 72, 42, -0.45, ...RED);
fillEllipse(55, 95,  42, 22, -1.0,  ...RED);   // Zange oben
fillEllipse(62, 155, 38, 20, -0.3,  ...RED);   // Zange unten
strokeEllipse(82, 130, 72, 42, -0.45, 4, ...DRED);

// Rechte Schere
fillEllipse(318, 130, 72, 42, 0.45, ...RED);
fillEllipse(345, 95,  42, 22, 1.0,  ...RED);
fillEllipse(338, 155, 38, 20, 0.3,  ...RED);
strokeEllipse(318, 130, 72, 42, 0.45, 4, ...DRED);

// 2. Beine (dünn, hinter dem Körper)
const legs = [
  [135, 240, 9, 38, -1.15], [112, 272, 9, 38, -1.05],
  [265, 240, 9, 38,  1.15], [288, 272, 9, 38,  1.05],
];
for (const [cx, cy, rx, ry, a] of legs) fillEllipse(cx, cy, rx, ry, a, ...RED);

// 3. Körper (Hauptoval)
fillEllipse(CX, CY, 125, 82, 0, ...RED);
strokeEllipse(CX, CY, 125, 82, 0, 5, ...DRED);

// 4. Körper-Glanzlicht (weißlicher Schimmer oben)
fillEllipse(CX-15, CY-20, 65, 38, -0.15, ...LRED, 120);
fillEllipse(CX-20, CY-30, 42, 22, -0.2,  255, 200, 200, 60);

// 5. Körper-Schatten unten
fillEllipse(CX, CY+20, 100, 50, 0, ...DRED, 60);

// 6. Augenstiele (kleine Verbindung zwischen Augen und Körper)
fillEllipse(163, 178, 18, 28, 0, ...RED);
fillEllipse(237, 178, 18, 28, 0, ...RED);

// 7. Augen (gelbe Ovale)
fillEllipse(160, 145, 36, 46, 0, ...CREAM);
strokeEllipse(160, 145, 36, 46, 0, 4, ...BLACK);
fillEllipse(240, 145, 36, 46, 0, ...CREAM);
strokeEllipse(240, 145, 36, 46, 0, 4, ...BLACK);

// 8. Pupillen
fillEllipse(165, 152, 22, 26, 0, ...BLACK);
fillEllipse(235, 152, 22, 26, 0, ...BLACK);

// 9. Glanzpunkte auf Pupillen
fillEllipse(170, 143, 9, 10, 0, ...WHITE);
fillEllipse(240, 143, 9, 10, 0, ...WHITE);

// 10. Scherenzange-Details (Lücke zwischen Zangen)
fillEllipse(50,  120, 18, 10, -0.9, ...BLACK, 180);  // linke Scheren-Lücke
fillEllipse(350, 120, 18, 10,  0.9, ...BLACK, 180);  // rechte

// Scherenglanzeit
fillEllipse(75, 112, 28, 16, -0.5,  ...LRED, 140);
fillEllipse(325, 112, 28, 16,  0.5, ...LRED, 140);

/* ── Speichern ─────────────────────────────────────── */
fs.writeFileSync('assets/krebs.png', toPNG(buf, SIZE));
console.log('✅ assets/krebs.png erstellt (400×400, RGBA)');
