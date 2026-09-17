// Génère build/icon.png (512x512) sans dépendance externe : PNG écrit à la main via zlib (déflate) + CRC32 maison.
const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

const SIZE = 512;

// --- CRC32 (implémentation standard, table précalculée) ---
const CRC_TABLE = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  CRC_TABLE[n] = c >>> 0;
}
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

// --- Dessin du pictogramme (colis de livraison) sur une grille RGBA ---
const BG = [37, 99, 235, 255]; // bleu (#2563EB)
const BG_DARK = [29, 78, 216, 255]; // ruban plus foncé (#1D4ED8)
const WHITE = [255, 255, 255, 255];

const pixels = Buffer.alloc(SIZE * SIZE * 4);

function setPx(x, y, color) {
  const idx = (y * SIZE + x) * 4;
  pixels[idx] = color[0];
  pixels[idx + 1] = color[1];
  pixels[idx + 2] = color[2];
  pixels[idx + 3] = color[3];
}

const CORNER_RADIUS = 96;

function insideRoundedSquare(x, y) {
  const rx = x < CORNER_RADIUS ? CORNER_RADIUS : x > SIZE - 1 - CORNER_RADIUS ? SIZE - 1 - CORNER_RADIUS : x;
  const ry = y < CORNER_RADIUS ? CORNER_RADIUS : y > SIZE - 1 - CORNER_RADIUS ? SIZE - 1 - CORNER_RADIUS : y;
  const dx = x - rx;
  const dy = y - ry;
  return dx * dx + dy * dy <= CORNER_RADIUS * CORNER_RADIUS;
}

const BOX_MARGIN = 128;
const RIBBON_HALF = 26;

for (let y = 0; y < SIZE; y++) {
  for (let x = 0; x < SIZE; x++) {
    if (!insideRoundedSquare(x, y)) {
      setPx(x, y, [0, 0, 0, 0]); // transparent hors du fond arrondi
      continue;
    }

    const inBoxX = x >= BOX_MARGIN && x <= SIZE - BOX_MARGIN;
    const inBoxY = y >= BOX_MARGIN && y <= SIZE - BOX_MARGIN;
    const centerX = SIZE / 2;
    const centerY = SIZE / 2;
    const onVerticalRibbon = Math.abs(x - centerX) <= RIBBON_HALF;
    const onHorizontalRibbon = Math.abs(y - centerY) <= RIBBON_HALF;

    if (inBoxX && inBoxY) {
      if (onVerticalRibbon || onHorizontalRibbon) {
        setPx(x, y, BG_DARK);
      } else {
        setPx(x, y, WHITE);
      }
    } else {
      setPx(x, y, BG);
    }
  }
}

// --- Assemblage du PNG (couleur RGBA, profondeur 8, filtre "none" par ligne) ---
const rawWithFilter = Buffer.alloc(SIZE * (SIZE * 4 + 1));
for (let y = 0; y < SIZE; y++) {
  const srcStart = y * SIZE * 4;
  const dstStart = y * (SIZE * 4 + 1);
  rawWithFilter[dstStart] = 0; // filter type: none
  pixels.copy(rawWithFilter, dstStart + 1, srcStart, srcStart + SIZE * 4);
}

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(SIZE, 0);
ihdr.writeUInt32BE(SIZE, 4);
ihdr[8] = 8; // bit depth
ihdr[9] = 6; // color type RGBA
ihdr[10] = 0;
ihdr[11] = 0;
ihdr[12] = 0;

const idatData = zlib.deflateSync(rawWithFilter, { level: 9 });

const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const png = Buffer.concat([
  signature,
  chunk('IHDR', ihdr),
  chunk('IDAT', idatData),
  chunk('IEND', Buffer.alloc(0)),
]);

const outPath = path.join(__dirname, 'icon.png');
fs.writeFileSync(outPath, png);
console.log('Icône générée :', outPath, `(${png.length} octets)`);
