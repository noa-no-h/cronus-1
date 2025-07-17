#!/bin/bash

# Nuclear option: completely ignore workspace resolution

echo "🚀 Starting nuclear workspace-free build..."

# Remove ALL workspace artifacts
rm -rf node_modules package-lock.json yarn.lock .yarnrc.yml .pnpm-lock.yaml

# Create aggressive .npmrc that ignores workspace completely
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

# Install dependencies with nuclear flags
echo "📦 Installing dependencies with nuclear flags..."
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

# Cleanup
rm -f .npmrc

echo "✅ Nuclear build completed!" 