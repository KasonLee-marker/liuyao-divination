const sharp = require('sharp');
const pngToIco = require('png-to-ico');
const path = require('path');
const fs = require('fs');

async function generateIcons() {
  const svgPath = path.join(__dirname, '..', 'build', 'icon.svg');
  const buildDir = path.join(__dirname, '..', 'build');
  
  const sizes = [16, 24, 32, 48, 64, 128, 256];
  const pngBuffers = [];
  
  // Generate PNG files
  for (const size of sizes) {
    const pngBuffer = await sharp(svgPath)
      .resize(size, size)
      .png()
      .toBuffer();
    pngBuffers.push(pngBuffer);
    console.log(`Generated ${size}x${size} PNG`);
  }
  
  // Generate ICO file using png-to-ico
  const icoBuffer = await pngToIco(pngBuffers);
  const icoPath = path.join(buildDir, 'icon.ico');
  fs.writeFileSync(icoPath, icoBuffer);
  console.log(`Generated icon.ico (${icoBuffer.length} bytes)`);
  
  // Also generate PNG for other uses
  const pngPath = path.join(buildDir, 'icon.png');
  await sharp(svgPath)
    .resize(256, 256)
    .png()
    .toFile(pngPath);
  console.log(`Generated icon.png`);
}

generateIcons().catch(console.error);
