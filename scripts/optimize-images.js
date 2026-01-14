#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');
const sharp = require('sharp');

// Configuration
const CONFIG_VERSION = '1.0'; // Increment this to force re-optimization of all images
const IMAGES_DIR = './images';
const CACHE_FILE = './data/optimization-cache.json';
const MIN_SAVINGS_THRESHOLD = 0.025; // 2.5% minimum savings to overwrite

// Load or initialize cache
function loadCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
    }
  } catch (err) {
    console.warn('⚠️  Failed to load cache, starting fresh:', err.message);
  }
  return { version: CONFIG_VERSION, hashes: {} };
}

// Save cache
function saveCache(cache) {
  try {
    // Ensure data directory exists
    const cacheDir = path.dirname(CACHE_FILE);
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
  } catch (err) {
    console.error('❌ Failed to save cache:', err.message);
  }
}

// Calculate file hash
function getFileHash(filePath) {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

// Get list of changed image files from git diff
function getChangedImageFiles() {
  try {
    // Get files changed in the last commit
    const output = execSync('git diff --name-only HEAD~1 HEAD', { encoding: 'utf8' });
    const changedFiles = output.split('\n').filter(Boolean);
    
    // Filter for image files in the images directory
    const imageExtensions = /\.(jpe?g|png|webp|avif|gif)$/i;
    const changedImages = changedFiles
      .filter(file => file.startsWith('images/') && imageExtensions.test(file))
      .map(file => path.basename(file));
    
    return changedImages;
  } catch (err) {
    // If git diff fails (e.g., first commit), return empty array
    console.warn('⚠️  Could not get changed files, will check all images');
    return null; // null means check all images
  }
}

// Optimize a single image
async function optimizeImage(filePath, filename) {
  const ext = path.extname(filename).toLowerCase();
  const originalSize = fs.statSync(filePath).size;
  
  let optimized;
  
  try {
    // Load image with sharp
    const image = sharp(filePath);
    const metadata = await image.metadata();
    
    // Apply format-specific optimizations
    if (ext === '.jpg' || ext === '.jpeg') {
      // JPEG: Quality 82, progressive, mozjpeg, strip metadata
      optimized = await image
        .jpeg({
          quality: 82,
          progressive: true,
          mozjpeg: true
        })
        .toBuffer();
        
    } else if (ext === '.png') {
      // PNG: Compress with palette quantization
      optimized = await image
        .png({
          compressionLevel: 9,
          palette: true
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
    
    // Only overwrite if savings meet threshold
    if (savings >= MIN_SAVINGS_THRESHOLD) {
      fs.writeFileSync(filePath, optimized);
      return {
        status: 'optimized',
        originalSize,
        optimizedSize,
        savings: savingsPercent
      };
    } else {
      return {
        status: 'skipped',
        reason: `insufficient savings (${savingsPercent}% < ${MIN_SAVINGS_THRESHOLD * 100}%)`
      };
    }
    
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
  
  // Load cache
  let cache = loadCache();
  
  // Check if config version changed (force re-optimization)
  if (cache.version !== CONFIG_VERSION) {
    console.log('⚠️  Configuration version changed, resetting cache\n');
    cache = { version: CONFIG_VERSION, hashes: {} };
  }
  
  // Get list of files to process
  const changedFiles = getChangedImageFiles();
  
  // Check if images directory exists
  if (!fs.existsSync(IMAGES_DIR)) {
    console.log('❌ Images directory not found');
    process.exit(1);
  }
  
  // Get all image files
  const allFiles = fs.readdirSync(IMAGES_DIR);
  const imageExtensions = /\.(jpe?g|png|webp|avif|gif)$/i;
  const imageFiles = allFiles.filter(file => imageExtensions.test(file));
  
  // Determine which files to process
  let filesToProcess;
  if (changedFiles === null) {
    // Process all files if we couldn't get changed files
    filesToProcess = imageFiles;
    console.log(`📂 Processing all ${imageFiles.length} images\n`);
  } else if (changedFiles.length === 0) {
    console.log('✅ No image files changed, skipping optimization\n');
    process.exit(0);
  } else {
    // Process only changed files
    filesToProcess = changedFiles.filter(file => imageFiles.includes(file));
    console.log(`📂 Processing ${filesToProcess.length} changed image(s)\n`);
  }
  
  // Track results
  const results = {
    optimized: [],
    skipped: [],
    errors: [],
    cached: []
  };
  
  // Process each image
  for (const filename of filesToProcess) {
    const filePath = path.join(IMAGES_DIR, filename);
    
    // Calculate current hash
    const currentHash = getFileHash(filePath);
    const cachedHash = cache.hashes[filename];
    
    // Skip if already optimized (hash matches)
    if (cachedHash === currentHash) {
      console.log(`⏩ ${filename} - already optimized`);
      results.cached.push(filename);
      continue;
    }
    
    // Optimize the image
    const result = await optimizeImage(filePath, filename);
    
    if (result.status === 'optimized') {
      console.log(`✅ ${filename} - optimized by ${result.savings}% (${formatBytes(result.originalSize)} → ${formatBytes(result.optimizedSize)})`);
      results.optimized.push({
        filename,
        savings: result.savings,
        originalSize: result.originalSize,
        optimizedSize: result.optimizedSize
      });
      
      // Update cache with new hash (file was modified by optimization)
      cache.hashes[filename] = getFileHash(filePath);
      
    } else if (result.status === 'skipped') {
      console.log(`⏭️  ${filename} - skipped (${result.reason})`);
      results.skipped.push({ filename, reason: result.reason });
      
      // Update cache even for skipped files to avoid re-checking
      cache.hashes[filename] = currentHash;
      
    } else if (result.status === 'error') {
      console.error(`❌ ${filename} - error: ${result.error}`);
      results.errors.push({ filename, error: result.error });
    }
  }
  
  // Save updated cache
  saveCache(cache);
  
  // Print summary
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Optimization Summary\n');
  console.log(`✅ Optimized: ${results.optimized.length}`);
  console.log(`⏭️  Skipped: ${results.skipped.length}`);
  console.log(`⏩ Cached: ${results.cached.length}`);
  console.log(`❌ Errors: ${results.errors.length}`);
  
  if (results.optimized.length > 0) {
    const totalOriginal = results.optimized.reduce((sum, r) => sum + r.originalSize, 0);
    const totalOptimized = results.optimized.reduce((sum, r) => sum + r.optimizedSize, 0);
    const totalSavings = ((totalOriginal - totalOptimized) / totalOriginal * 100).toFixed(2);
    console.log(`\n💾 Total savings: ${formatBytes(totalOriginal - totalOptimized)} (${totalSavings}%)`);
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
