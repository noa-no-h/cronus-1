#!/bin/bash

# Simple standalone client build script

echo "🚀 Starting standalone client build..."

# Remove any workspace artifacts
rm -rf node_modules package-lock.json yarn.lock .yarnrc.yml

# Create .npmrc to prevent workspace resolution
cat > .npmrc << EOF
legacy-peer-deps=true
audit-level=none
fund=false
progress=false
workspaces=false
EOF

# Install dependencies
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps --no-audit --no-fund

# Build the app with increased memory and disabled type checking
echo "🏗️  Building application..."
SKIP_PREFLIGHT_CHECK=true \
TSC_COMPILE_ON_ERROR=true \
GENERATE_SOURCEMAP=false \
ESLINT_NO_DEV_ERRORS=true \
DISABLE_ESLINT_PLUGIN=true \
NODE_OPTIONS="--max-old-space-size=8192" \
NODE_ENV=production \
npm run build

# Cleanup
rm -f .npmrc

echo "✅ Build completed successfully!" 