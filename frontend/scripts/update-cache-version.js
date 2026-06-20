const fs = require('fs');
const path = require('path');

// Update cache version in service worker
const updateCacheVersion = () => {
  const timestamp = Date.now();
  const cacheVersion = `svm-helpdesk-v5-${timestamp}`;
  
  // Update build/sw.js
  const buildSwPath = path.join(__dirname, '../build/sw.js');
  if (fs.existsSync(buildSwPath)) {
    let swContent = fs.readFileSync(buildSwPath, 'utf8');
    swContent = swContent.replace(/svm-helpdesk-v5-[0-9]+/g, cacheVersion);
    fs.writeFileSync(buildSwPath, swContent);
    console.log(`✅ Updated cache version in build/sw.js: ${cacheVersion}`);
  }
  
  // Update public/sw.js
  const publicSwPath = path.join(__dirname, '../public/sw.js');
  if (fs.existsSync(publicSwPath)) {
    let swContent = fs.readFileSync(publicSwPath, 'utf8');
    swContent = swContent.replace(/svm-helpdesk-v5-[0-9]+/g, cacheVersion);
    fs.writeFileSync(publicSwPath, swContent);
    console.log(`✅ Updated cache version in public/sw.js: ${cacheVersion}`);
  }
  
  // Update manifest.json version
  const manifestPath = path.join(__dirname, '../build/manifest.json');
  if (fs.existsSync(manifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    manifest.version = timestamp.toString();
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    console.log(`✅ Updated manifest.json version: ${timestamp}`);
  }
  
  console.log(`🚀 Cache version updated to: ${cacheVersion}`);
};

updateCacheVersion();

