#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function generateManifest() {
  const BUILD_DIR = './build';
  const imagesDir = path.join(BUILD_DIR, 'images');
  const outputPath = path.join(BUILD_DIR, 'data', 'images.json');

  // Create data directory
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  // Check if images directory exists
  if (!fs.existsSync(imagesDir)) {
    console.log('❌ Build images directory not found');
    process.exit(1);
  }

  // Read optimized images from build directory
  const files = fs.readdirSync(imagesDir);
  const imageExtensions = /\.(jpe?g|png|gif|webp|avif)$/i;
  const images = [];

  for (const file of files) {
    if (!imageExtensions.test(file)) continue;

    const filePath = path.join(imagesDir, file);

    try {
      const metadata = await sharp(filePath).metadata();
      images.push({
        filename: file,
        width: metadata.width,
        height: metadata.height
      });
      console.log(`✓ ${file} (${metadata.width}x${metadata.height})`);
    } catch (err) {
      console.error(`✗ ${file}: ${err.message}`);
    }
  }

  // Sort alphabetically for consistent output
  images.sort((a, b) => a.filename.localeCompare(b.filename));

  fs.writeFileSync(outputPath, JSON.stringify(images, null, 2));
  console.log(`\n📄 Generated manifest with ${images.length} images`);
}

generateManifest().catch(err => {
  console.error('❌ Failed to generate manifest:', err);
  process.exit(1);
});
