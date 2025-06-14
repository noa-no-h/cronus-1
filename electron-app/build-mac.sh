#!/bin/bash
set -ex

# Set environment variables for electron-builder to find the certificate.
# This script should be run from the root of the 'electron-app' directory.
export CSC_LINK="./build-assets/mac-cert.p12"
export CSC_KEY_PASSWORD="6xC;).arne"
export DEBUG="electron-builder"

echo "🔐 Signing certificate and password environment variables set."
echo "🐛 Electron-builder debug mode enabled."

# Run the Electron build process. electron-builder will automatically pick up
# the CSC_LINK and CSC_KEY_PASSWORD environment variables.
bunx electron-vite build && bunx electron-builder --mac --dir

echo "✅ Build and signing process complete."
echo "🔍 Verifying application signature..."

# The output directory can be mac, mac-arm64, etc. Use a glob to find the app.
APP_PATH=$(find dist/mac* -name "Cronus.app" | head -n 1)

if [ -z "$APP_PATH" ]; then
    echo "❌ ERROR: Could not find Cronus.app in dist/ directory to verify."
    exit 1
fi

echo "Verifying signature for: $APP_PATH"
codesign --verify --verbose --deep --strict "$APP_PATH"

echo "✅ Signature verification command executed."
echo "🚀 Signed app available at: $APP_PATH" 