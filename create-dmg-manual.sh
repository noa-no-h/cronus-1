#!/bin/bash
set -ex

# Set environment variables for electron-builder to find the certificate.
export CSC_LINK="./build-assets/mac-cert.p12"
export CSC_KEY_PASSWORD="6xC;).arne"

echo "🔐 Signing certificate and password environment variables set."
echo "🚀 Building signed app bundle..."

# Build the signed app bundle (without DMG)
bunx electron-vite build && bunx electron-builder --mac --dir

echo "✅ App bundle build complete."
echo "📦 Creating proper installer DMG..."

# Create DMG with proper installer layout using the exact working command
DMG_NAME="Cronus-$(date +%Y%m%d-%H%M%S).dmg"
TEMP_DMG_DIR="/tmp/cronus_dmg_temp"

# Clean up any existing temp directory
rm -rf "$TEMP_DMG_DIR"
mkdir -p "$TEMP_DMG_DIR"

# Copy the app to temp directory
cp -R "dist/mac-arm64/Cronus.app" "$TEMP_DMG_DIR/"

# Create Applications folder symlink
ln -s /Applications "$TEMP_DMG_DIR/Applications"

# Create the DMG
hdiutil create -volname "Cronus" -srcfolder "$TEMP_DMG_DIR" -ov -format UDZO "dist/$DMG_NAME"

# Clean up temp directory
rm -rf "$TEMP_DMG_DIR"

echo "✅ DMG created successfully: dist/$DMG_NAME"
echo "🔍 Verifying app signature in DMG..."

# Mount the DMG and verify the signature
hdiutil attach "dist/$DMG_NAME" -mountpoint "/tmp/cronus_dmg_mount"
codesign --verify --verbose --deep --strict "/tmp/cronus_dmg_mount/Cronus.app"
hdiutil detach "/tmp/cronus_dmg_mount"

echo "✅ DMG verification complete!"
echo "🚀 Ready for distribution: dist/$DMG_NAME"
echo "📁 DMG now includes Applications folder for easy installation"

# Open the DMG
open "dist/$DMG_NAME" 