#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const IMAGES_DIR = './images';
const CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

// Generate random 8-character filename
function generateRandomName() {
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += CHARSET.charAt(Math.floor(Math.random() * CHARSET.length));
  }
  return result;
}

// Anonymize a single image
async function anonymizeImage(filePath, filename) {
  const ext = path.extname(filename).toLowerCase();

  // Generate unique random name
  let newName;
  let newPath;
  const usedNames = new Set();

  do {
    newName = generateRandomName() + ext;
    newPath = path.join(IMAGES_DIR, newName);
  } while (fs.existsSync(newPath) || usedNames.has(newName));

  usedNames.add(newName);

  try {
    let image = sharp(filePath);
    const metadata = await image.metadata();

    // Strip metadata and save with high quality
    if (ext === '.jpg' || ext === '.jpeg') {
      await image
        .jpeg({
          quality: 100,
          progressive: true,
          mozjpeg: true
        })
        .toFile(newPath);

    } else if (ext === '.png') {
      await image
        .png({
          compressionLevel: 0 // No compression, preserve quality
        })
        .toFile(newPath);

    } else if (ext === '.webp') {
      await image
        .webp({
          quality: 100,
          lossless: true
        })
        .toFile(newPath);

    } else if (ext === '.avif') {
      await image
        .avif({
          quality: 100,
          lossless: true
        })
        .toFile(newPath);

    } else if (ext === '.gif') {
      // For GIF, just copy the file
      fs.copyFileSync(filePath, newPath);
      fs.unlinkSync(filePath);
      return { oldName: filename, newName, status: 'copied' };

    } else {
      return { oldName: filename, newName: null, status: 'skipped' };
    }

    // Delete original file
    fs.unlinkSync(filePath);

    return { oldName: filename, newName, status: 'renamed' };

  } catch (err) {
    return { oldName: filename, newName: null, status: 'error', error: err.message };
  }
}

async function main() {
  console.log('🎲 Image Anonymizer');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('⚠️  WARNING: This will rename all images to random 8-character names!');
  console.log('⚠️  Make sure you have a backup before proceeding.\n');

  // Check if images directory exists
  if (!fs.existsSync(IMAGES_DIR)) {
    console.log('❌ Images directory not found');
    process.exit(1);
  }

  // Get all image files
  const allFiles = fs.readdirSync(IMAGES_DIR);
  const imageExtensions = /\.(jpe?g|png|webp|avif|gif)$/i;
  const imageFiles = allFiles.filter(file => imageExtensions.test(file));

  console.log(`📂 Found ${imageFiles.length} images to anonymize\n`);

  const results = [];

  // Process each image
  for (const filename of imageFiles) {
    const filePath = path.join(IMAGES_DIR, filename);
    const result = await anonymizeImage(filePath, filename);
    results.push(result);

    if (result.status === 'renamed' || result.status === 'copied') {
      console.log(`✅ ${result.oldName} → ${result.newName}`);
    } else if (result.status === 'skipped') {
      console.log(`⏭️  ${result.oldName} - skipped (unsupported format)`);
    } else if (result.status === 'error') {
      console.error(`❌ ${result.oldName} - error: ${result.error}`);
    }
  }

  // Print summary
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Summary\n');

  const renamed = results.filter(r => r.status === 'renamed' || r.status === 'copied').length;
  const skipped = results.filter(r => r.status === 'skipped').length;
  const errors = results.filter(r => r.status === 'error').length;

  console.log(`✅ Renamed: ${renamed}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  console.log(`❌ Errors: ${errors}`);
  console.log('\n✨ Done!\n');
}

main().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
