#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# Ultra-isolated build script - complete workspace isolation

echo "🚀 Starting ultra-isolated build..."

# Create temporary directory outside workspace
TEMP_DIR=$(mktemp -d)
echo "📁 Building in isolated environment: $TEMP_DIR"

# Copy client to temp directory
cp -r . "$TEMP_DIR/"
cd "$TEMP_DIR"

# Remove any workspace artifacts
rm -rf node_modules package-lock.json yarn.lock .yarnrc.yml .pnpm-lock.yaml

# Create completely isolated .npmrc
cat > .npmrc << EOF
legacy-peer-deps=true
audit-level=none
fund=false
progress=false
workspaces=false
ignore-workspace-root-check=true
prefer-offline=false
cache=false
EOF

# Install dependencies in complete isolation
echo "📦 Installing dependencies in isolation..."
npm install \
  --ignore-workspace-root-check \
  --legacy-peer-deps \
  --no-audit \
  --no-fund \
  --force \
  --no-optional

# Build the app
echo "🏗️  Building application..."
SKIP_PREFLIGHT_CHECK=true \
TSC_COMPILE_ON_ERROR=true \
GENERATE_SOURCEMAP=false \
ESLINT_NO_DEV_ERRORS=true \
DISABLE_ESLINT_PLUGIN=true \
NODE_OPTIONS="--max-old-space-size=8192" \
NODE_ENV=production \
npm run build

# Copy build back to original location
echo "📦 Copying build back to original location..."
# Create build dir in original location if it doesn't exist
mkdir -p "$OLDPWD/build"
# Copy contents of temp build dir to original build dir
cp -r build/. "$OLDPWD/build/"


# Cleanup
cd "$OLDPWD"
rm -rf "$TEMP_DIR"

echo "✅ Ultra-isolated build completed successfully!" 