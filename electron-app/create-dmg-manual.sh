#!/bin/bash
set -ex

# Set environment variables for electron-builder to find the certificate.
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
echo "🚀 Building signed app bundle..."

# Build the signed app bundle (without DMG)
bunx electron-vite build && bunx electron-builder --mac --dir

echo "✅ App bundle build complete."
echo "📦 Creating proper installer DMG..."

# Find the app bundle
APP_PATH=$(find dist/mac* -name "Cronus.app" | head -n 1)

if [ -z "$APP_PATH" ]; then
    echo "❌ ERROR: Could not find Cronus.app in dist/ directory."
    exit 1
fi

echo "Found app at: $APP_PATH"

# Create DMG with proper installer layout using the exact working command
DMG_NAME="Cronus-$(date +%Y%m%d-%H%M%S).dmg"
TEMP_DMG_DIR="/tmp/cronus_dmg_temp"

# Clean up any existing temp directory
rm -rf "$TEMP_DMG_DIR"
mkdir -p "$TEMP_DMG_DIR"

# Copy the app to temp directory
cp -R "$APP_PATH" "$TEMP_DMG_DIR/"

# Create Applications folder shortcut
ln -s /Applications "$TEMP_DMG_DIR/Applications"

# Create the DMG
hdiutil create -volname "Cronus" -srcfolder "$TEMP_DMG_DIR" -ov -format UDZO "dist/$DMG_NAME"

# Clean up temp directory
rm -rf "$TEMP_DMG_DIR"

echo "✅ DMG created: dist/$DMG_NAME"

# Verify the app signature
echo "🔍 Verifying application signature..."
codesign --verify --verbose --deep --strict "$APP_PATH"
echo "✅ Signature verification passed."

# Open the DMG
open "dist/$DMG_NAME" 