const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Install dependencies
console.log('Installing dependencies...');
execSync('npm install', { stdio: 'inherit' });

// Run TypeScript compiler
console.log('Compiling TypeScript...');
execSync('npx tsc', { stdio: 'inherit' });

// Create shared directory in dist
console.log('Copying shared types...');
const sharedDistDir = path.join(__dirname, 'dist', 'shared');
if (!fs.existsSync(sharedDistDir)) {
  fs.mkdirSync(sharedDistDir, { recursive: true });
}

// Copy shared types
const sharedTypesSource = path.join(__dirname, '..', 'shared', 'types.ts');
const sharedTypesDest = path.join(sharedDistDir, 'types.ts');
fs.copyFileSync(sharedTypesSource, sharedTypesDest);

// Move server/src/index.js to dist/index.js
console.log('Moving files to correct locations...');
const serverSrcIndexPath = path.join(__dirname, 'dist', 'server', 'src', 'index.js');
const distIndexPath = path.join(__dirname, 'dist', 'index.js');
const distDir = path.join(__dirname, 'dist');
const serverSrcDir = path.join(__dirname, 'dist', 'server', 'src');

if (fs.existsSync(serverSrcIndexPath)) {
  // Create directory if it doesn't exist
  if (!fs.existsSync(path.dirname(distIndexPath))) {
    fs.mkdirSync(path.dirname(distIndexPath), { recursive: true });
  }

  // Copy the file
  fs.copyFileSync(serverSrcIndexPath, distIndexPath);

  // Copy routers
  if (fs.existsSync(path.join(serverSrcDir, 'routers'))) {
    fs.mkdirSync(path.join(distDir, 'routers'), { recursive: true });
    const routerFiles = fs.readdirSync(path.join(serverSrcDir, 'routers'));
    routerFiles.forEach((file) => {
      fs.copyFileSync(
        path.join(serverSrcDir, 'routers', file),
        path.join(distDir, 'routers', file)
      );
    });
  }

  // Copy models
  if (fs.existsSync(path.join(serverSrcDir, 'models'))) {
    fs.mkdirSync(path.join(distDir, 'models'), { recursive: true });
    const modelFiles = fs.readdirSync(path.join(serverSrcDir, 'models'));
    modelFiles.forEach((file) => {
      fs.copyFileSync(path.join(serverSrcDir, 'models', file), path.join(distDir, 'models', file));
    });
  }

  // Copy lib if it exists
  if (fs.existsSync(path.join(serverSrcDir, 'lib'))) {
    fs.mkdirSync(path.join(distDir, 'lib'), { recursive: true });
    const libFiles = fs.readdirSync(path.join(serverSrcDir, 'lib'));
    libFiles.forEach((file) => {
      fs.copyFileSync(path.join(serverSrcDir, 'lib', file), path.join(distDir, 'lib', file));
    });
  }
}

console.log('Build completed successfully!');
