#!/bin/bash
set -e

echo "=== POST-BUILD DEEP SIGNING SCRIPT (v2) ==="

# --- Configuration ---
# Hardcode the identity to avoid issues with build context
IDENTITY="Developer ID Application: Arne Strickmann (2AZ6648627)"
SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &> /dev/null && pwd)
ENTITLEMENTS_PATH="$SCRIPT_DIR/../entitlements.mac.plist"

# --- Arguments ---
APP_PATH="$1"

# --- Validation ---
if [ -z "$APP_PATH" ]; then
    echo "❌ ERROR: App path argument not provided."
    exit 1
fi
if [ ! -f "$ENTITLEMENTS_PATH" ]; then
    echo "❌ ERROR: Entitlements file not found at $ENTITLEMENTS_PATH"
    exit 1
fi
if [ ! -d "$APP_PATH" ]; then
    echo "❌ ERROR: App not found at $APP_PATH"
    exit 1
fi

echo "🎯 Target app: $APP_PATH"
echo "🔑 Identity: $IDENTITY"
echo "📄 Entitlements: $ENTITLEMENTS_PATH"
echo ""

# --- Signing ---

FRAMEWORKS_PATH="$APP_PATH/Contents/Frameworks"

# Sign helper apps first
if [ -d "$FRAMEWORKS_PATH" ]; then
    echo "✍️  Signing helper apps in $FRAMEWORKS_PATH..."
    find "$FRAMEWORKS_PATH" -maxdepth 2 -name "*.app" | while read -r helper_app; do
        echo "   -> Injecting AppleEvents permission into $helper_app/Contents/Info.plist"
        /usr/bin/plutil -insert "NSAppleEventsUsageDescription" -string "Cronus needs to access information from your web browser to track your activity." "$helper_app/Contents/Info.plist"
        echo "   -> Signing $helper_app"
        codesign --force --verify --verbose --sign "$IDENTITY" --entitlements "$ENTITLEMENTS_PATH" --options=runtime "$helper_app"
    done
    echo "✅ Helper apps signed."
    echo ""
fi

# Sign frameworks
if [ -d "$FRAMEWORKS_PATH" ]; then
    echo "✍️  Signing frameworks in $FRAMEWORKS_PATH..."
    find "$FRAMEWORKS_PATH" -maxdepth 2 -name "*.framework" | while read -r framework; do
        echo "   -> Signing $framework"
        codesign --force --verify --verbose --sign "$IDENTITY" --options=runtime "$framework"
    done
    echo "✅ Frameworks signed."
    echo ""
fi

# Sign the native module
NATIVE_MODULE_PATH="$APP_PATH/Contents/Resources/native/nativeWindows.node"
if [ -f "$NATIVE_MODULE_PATH" ]; then
    echo "✍️  Signing native module: $NATIVE_MODULE_PATH..."
    codesign --force --verify --verbose --sign "$IDENTITY" --entitlements "$ENTITLEMENTS_PATH" --options=runtime "$NATIVE_MODULE_PATH"
    echo "✅ Native module signed."
    echo ""
fi

# Finally, sign the main application
echo "✍️  Signing the main application bundle..."
codesign --force --verify --verbose --sign "$IDENTITY" --entitlements "$ENTITLEMENTS_PATH" --options=runtime "$APP_PATH"
echo "✅ Main application signed."
echo ""

echo "=== ✅ POST-BUILD DEEP SIGNING COMPLETE ===" 