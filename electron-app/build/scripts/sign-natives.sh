#!/bin/bash
set -e  

IDENTITY="Developer ID Application: Arne Strickmann (2AZ6648627)" 

echo "Starting native module signing process..."

# Sign the native-windows module
NATIVE_WINDOWS_PATH="src/native-modules/native-windows/bin/darwin-arm64-133/native-windows.node"
if [ -f "$NATIVE_WINDOWS_PATH" ]; then
    echo "Signing $NATIVE_WINDOWS_PATH"
    codesign --force \
        --sign "$IDENTITY" \
        --options runtime \
        --entitlements build/entitlements.mac.plist \
        --timestamp \
        --verbose \
        "$NATIVE_WINDOWS_PATH"
    
    echo "Verifying signature..."
    codesign --verify --verbose "$NATIVE_WINDOWS_PATH"
else
    echo "Warning: $NATIVE_WINDOWS_PATH not found. Make sure to rebuild native modules first."
fi

echo "Native module signing complete!"