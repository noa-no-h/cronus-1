#!/bin/bash
set -ex

# Set environment variables for electron-builder to find the certificate.
# This script should be run from the root of the 'electron-app' directory.
export CSC_LINK="./build-assets/mac-cert.p12"
export CSC_KEY_PASSWORD="6xC;).arne"

echo "🧹 Cleaning up any existing Cronus processes and files..."

# Kill any running Cronus processes
pkill -f "Cronus" || true
pkill -f "cronus" || true

# Wait a moment for processes to fully terminate
sleep 2

# Remove any existing app bundles
rm -rf "/Applications/Cronus.app" || true
rm -rf "$HOME/Applications/Cronus.app" || true
rm -rf "./dist/mac-arm64/Cronus.app" || true
rm -rf "./dist/mac/Cronus.app" || true
rm -rf "./dist/Cronus.app" || true

# Clear any cached app data
rm -rf "$HOME/Library/Application Support/cronus-electron-app" || true
rm -rf "$HOME/Library/Application Support/Cronus" || true
rm -rf "$HOME/Library/Caches/com.cronus.app" || true
rm -rf "$HOME/Library/Preferences/com.cronus.app.plist" || true

# Reset accessibility permissions for our app (this will require re-granting)
tccutil reset AppleEvents com.cronus.app || true
tccutil reset Accessibility com.cronus.app || true

echo "🔐 Signing certificate and password environment variables set."

# Run the Electron build process. electron-builder will automatically pick up
# the CSC_LINK and CSC_KEY_PASSWORD environment variables.
bunx electron-vite build && bunx electron-builder --mac --dir

echo "✅ Build and signing process complete."
echo "🔍 Verifying application signature..."

# The output directory can be mac, mac-arm64, etc. Use a glob to find the app.
APP_PATH=$(find dist/mac* -name "Cronus.app" | head -n 1)

if [ -z "$APP_PATH" ]; then
    echo "❌ ERROR: Could not find Cronus.app in dist/ directory."
    exit 1
fi

echo "Verifying signature for: $APP_PATH"
codesign --verify --verbose --deep --strict "$APP_PATH"

echo "✅ Signature verification command executed."
echo "🚀 Signed app available at: $APP_PATH" 