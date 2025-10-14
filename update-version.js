#!/usr/bin/env node

/**
 * Version Update Script for Merchant Services Solutions App
 * 
 * This script helps update version numbers across all files to ensure
 * proper cache busting when deploying updates to GitHub Pages.
 * 
 * Usage: node update-version.js [new-version]
 * Example: node update-version.js 1.0.1
 */

const fs = require('fs');
const path = require('path');

// Get version from command line or use timestamp
const newVersion = process.argv[2] || `1.0.${Date.now()}`;
const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');

console.log(`🔄 Updating app version to: ${newVersion}`);
console.log(`📅 Using timestamp: ${timestamp}`);

// Files to update with their patterns
const filesToUpdate = [
  {
    file: 'app.js',
    patterns: [
      { search: /const APP_VERSION = '[^']*';/, replace: `const APP_VERSION = '${newVersion}';` }
    ]
  },
  {
    file: 'index.html',
    patterns: [
      { search: /src="app\.js\?v=[^"]*"/, replace: `src="app.js?v=${newVersion}&t=${timestamp}"` }
    ]
  },
  {
    file: 'admin.html',
    patterns: [
      { search: /src="admin\.js\?v=[^"]*"/, replace: `src="admin.js?v=${newVersion}&t=${timestamp}"` }
    ]
  },
  {
    file: 'admin.js',
    patterns: [
      { search: /return `\${url}\${separator}v=[^`]*&t=\${Date\.now\(\)}`;/, replace: `return \`\${url}\${separator}v=${newVersion}&t=\${Date.now()}\`;` }
    ]
  }
];

// Update each file
filesToUpdate.forEach(({ file, patterns }) => {
  if (!fs.existsSync(file)) {
    console.log(`⚠️  File not found: ${file}`);
    return;
  }

  let content = fs.readFileSync(file, 'utf8');
  let updated = false;

  patterns.forEach(({ search, replace }) => {
    if (search.test(content)) {
      content = content.replace(search, replace);
      updated = true;
    }
  });

  if (updated) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`✅ Updated: ${file}`);
  } else {
    console.log(`ℹ️  No changes needed: ${file}`);
  }
});

console.log(`\n🎉 Version update complete!`);
console.log(`\nNext steps:`);
console.log(`1. Test your changes locally`);
console.log(`2. Commit and push to GitHub`);
console.log(`3. GitHub Pages will automatically deploy the new version`);
console.log(`\nUsers will now see the latest version when they visit your app!`);

