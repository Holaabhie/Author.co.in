/**
 * Generate all favicon assets from the source image:
 *   - src/app/icon.png       (192x192 PNG)
 *   - src/app/apple-icon.png (180x180 PNG)
 *   - src/app/favicon.ico    (multi-size ICO: 16, 32, 48)
 */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', '.gemini-src-favicon.jpg'); // temp renamed source
const APP_DIR = path.join(__dirname, '..', 'src', 'app');

// The source file is actually JPEG despite .png extension
const ORIGINAL = path.join(APP_DIR, 'icon.png');

async function main() {
  // Read the original source (it's JPEG data)
  const srcBuffer = fs.readFileSync(ORIGINAL);
  
  // 1. Create icon.png (192x192) — standard web icon
  const icon192 = await sharp(srcBuffer)
    .resize(192, 192, { fit: 'cover' })
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(APP_DIR, 'icon.png'), icon192);
  console.log('✓ icon.png (192x192)', icon192.length, 'bytes');

  // 2. Create apple-icon.png (180x180) — Apple touch icon
  const apple180 = await sharp(srcBuffer)
    .resize(180, 180, { fit: 'cover' })
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(APP_DIR, 'apple-icon.png'), apple180);
  console.log('✓ apple-icon.png (180x180)', apple180.length, 'bytes');

  // 3. Create favicon.ico with 16x16, 32x32, 48x48 PNG layers
  const sizes = [16, 32, 48];
  const pngBuffers = [];
  for (const size of sizes) {
    const buf = await sharp(srcBuffer)
      .resize(size, size, { fit: 'cover' })
      .png()
      .toBuffer();
    pngBuffers.push({ size, data: buf });
    console.log(`  Prepared ${size}x${size} PNG (${buf.length} bytes)`);
  }

  // Build ICO file
  const numImages = pngBuffers.length;
  const headerSize = 6;
  const dirEntrySize = 16;
  const dirSize = dirEntrySize * numImages;
  
  // Calculate offsets
  let dataOffset = headerSize + dirSize;
  const entries = pngBuffers.map(({ size, data }) => {
    const entry = { size, data, offset: dataOffset };
    dataOffset += data.length;
    return entry;
  });

  // ICO Header
  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0);          // Reserved
  header.writeUInt16LE(1, 2);          // Type: ICO
  header.writeUInt16LE(numImages, 4);  // Count

  // Directory entries
  const dirBuffers = entries.map(({ size, data, offset }) => {
    const dir = Buffer.alloc(dirEntrySize);
    dir.writeUInt8(size >= 256 ? 0 : size, 0);  // Width
    dir.writeUInt8(size >= 256 ? 0 : size, 1);  // Height
    dir.writeUInt8(0, 2);              // Color palette
    dir.writeUInt8(0, 3);              // Reserved
    dir.writeUInt16LE(1, 4);           // Color planes
    dir.writeUInt16LE(32, 6);          // Bits per pixel
    dir.writeUInt32LE(data.length, 8); // Image data size
    dir.writeUInt32LE(offset, 12);     // Offset to data
    return dir;
  });

  const ico = Buffer.concat([
    header,
    ...dirBuffers,
    ...entries.map(e => e.data),
  ]);
  
  fs.writeFileSync(path.join(APP_DIR, 'favicon.ico'), ico);
  console.log('✓ favicon.ico', ico.length, 'bytes (contains', sizes.join(', '), 'px layers)');
  
  console.log('\nAll favicon assets created successfully!');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
