#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Configuration
const IMAGES_DIR = './images';
const BUILD_DIR = './build';
const OUTPUT_IMAGES_DIR = path.join(BUILD_DIR, 'images');
const MAX_IMAGE_DIMENSION = 2400; // Maximum width or height in pixels

// Optimize a single image
async function optimizeImage(inputPath, outputPath, filename) {
  const ext = path.extname(filename).toLowerCase();
  const originalSize = fs.statSync(inputPath).size;

  let optimized;

  try {
    // Load image with sharp
    let image = sharp(inputPath);
    const metadata = await image.metadata();

    // Resize if image is too large (maintaining aspect ratio)
    const maxDimension = Math.max(metadata.width, metadata.height);
    let wasResized = false;
    if (maxDimension > MAX_IMAGE_DIMENSION) {
      const resizeOptions = {};
      if (metadata.width > metadata.height) {
        resizeOptions.width = MAX_IMAGE_DIMENSION;
      } else {
        resizeOptions.height = MAX_IMAGE_DIMENSION;
      }
      resizeOptions.fit = 'inside'; // Maintain aspect ratio
      resizeOptions.withoutEnlargement = true; // Never upscale

      image = image.resize(resizeOptions);
      wasResized = true;
    }

    // Apply format-specific optimizations
    if (ext === '.jpg' || ext === '.jpeg' || ext === '.png') {
      // Convert JPEG and PNG to WebP for better compression
      optimized = await image
        .webp({
          quality: 82,        // Match current JPEG quality
          effort: 6,          // Maximum compression effort (0-6)
          lossless: false,
          nearLossless: false
        })
        .toBuffer();

    } else if (ext === '.webp') {
      // WebP: Quality 80
      optimized = await image
        .webp({
          quality: 80
        })
        .toBuffer();

    } else if (ext === '.avif') {
      // AVIF: Quality 50
      optimized = await image
        .avif({
          quality: 50
        })
        .toBuffer();

    } else if (ext === '.gif') {
      // Skip GIF to preserve animations
      return { status: 'skipped', reason: 'GIF animations preserved' };

    } else {
      return { status: 'skipped', reason: 'unsupported format' };
    }

    const optimizedSize = optimized.length;
    const savings = (originalSize - optimizedSize) / originalSize;
    const savingsPercent = (savings * 100).toFixed(2);

    // Change extension to .webp for JPEG/PNG conversions
    let outputFilename = filename;
    if (ext === '.jpg' || ext === '.jpeg' || ext === '.png') {
      outputFilename = filename.replace(/\.(jpe?g|png)$/i, '.webp');
    }
    const finalOutputPath = path.join(path.dirname(outputPath), outputFilename);

    // Write optimized file to output directory
    fs.writeFileSync(finalOutputPath, optimized);

    return {
      status: 'optimized',
      originalSize,
      optimizedSize,
      savings: savingsPercent,
      wasResized
    };

  } catch (err) {
    return {
      status: 'error',
      error: err.message
    };
  }
}

// Main function
async function main() {
  console.log('🖼️  Image Optimization Tool');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Create build directory structure
  fs.mkdirSync(OUTPUT_IMAGES_DIR, { recursive: true });

  // Check if images directory exists
  if (!fs.existsSync(IMAGES_DIR)) {
    console.log('❌ Images directory not found');
    process.exit(1);
  }

  // Get all image files from source directory
  const allFiles = fs.readdirSync(IMAGES_DIR);
  const imageExtensions = /\.(jpe?g|png|webp|avif|gif)$/i;
  const imageFiles = allFiles.filter(file => imageExtensions.test(file));

  console.log(`📂 Processing all ${imageFiles.length} images\n`);

  // Track results
  const results = {
    optimized: [],
    skipped: [],
    errors: []
  };

  // Process each image
  for (const filename of imageFiles) {
    const inputPath = path.join(IMAGES_DIR, filename);
    const outputPath = path.join(OUTPUT_IMAGES_DIR, filename);

    // Optimize the image
    const result = await optimizeImage(inputPath, outputPath, filename);

    if (result.status === 'optimized') {
      const resizeInfo = result.wasResized ? ' [resized]' : '';
      const ext = path.extname(filename).toLowerCase();
      const convertedToWebP = (ext === '.jpg' || ext === '.jpeg' || ext === '.png');
      const conversionInfo = convertedToWebP ? ' → WebP' : '';
      console.log(`✅ ${filename}${resizeInfo}${conversionInfo} - optimized by ${result.savings}% (${formatBytes(result.originalSize)} → ${formatBytes(result.optimizedSize)})`);
      results.optimized.push({
        filename,
        savings: result.savings,
        originalSize: result.originalSize,
        optimizedSize: result.optimizedSize,
        wasResized: result.wasResized
      });

    } else if (result.status === 'skipped') {
      console.log(`⏭️  ${filename} - skipped (${result.reason})`);
      results.skipped.push({ filename, reason: result.reason });

    } else if (result.status === 'error') {
      console.error(`❌ ${filename} - error: ${result.error}`);
      results.errors.push({ filename, error: result.error });
    }
  }

  // Print summary
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Optimization Summary\n');
  console.log(`✅ Optimized: ${results.optimized.length}`);
  console.log(`⏭️  Skipped: ${results.skipped.length}`);
  console.log(`❌ Errors: ${results.errors.length}`);

  if (results.optimized.length > 0) {
    const totalOriginal = results.optimized.reduce((sum, r) => sum + r.originalSize, 0);
    const totalOptimized = results.optimized.reduce((sum, r) => sum + r.optimizedSize, 0);
    const totalSavings = ((totalOriginal - totalOptimized) / totalOriginal * 100).toFixed(2);
    const resizedCount = results.optimized.filter(r => r.wasResized).length;

    console.log(`\n💾 Total savings: ${formatBytes(totalOriginal - totalOptimized)} (${totalSavings}%)`);
    if (resizedCount > 0) {
      console.log(`📐 Images resized: ${resizedCount} (max dimension: ${MAX_IMAGE_DIMENSION}px)`);
    }
  }

  console.log('\n✨ Done!\n');
}

// Helper function to format bytes
function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

// Run main function
main().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
