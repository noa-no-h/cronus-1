#!/bin/bash
set -e

BUCKET_NAME="cronusnewupdates"
CURRENT_VERSION=$(node -p "require('./package.json').version")

echo "Checking publication status for version $CURRENT_VERSION"
echo "================================================"

# Check if versioned files exist
echo "Checking versioned files:"
DMG_EXISTS=$(aws s3 ls "s3://$BUCKET_NAME/Cronus-$CURRENT_VERSION-arm64.dmg" 2>/dev/null || echo "")
ZIP_EXISTS=$(aws s3 ls "s3://$BUCKET_NAME/Cronus-$CURRENT_VERSION-arm64-mac.zip" 2>/dev/null || echo "")

if [ -n "$DMG_EXISTS" ]; then
    echo "✅ DMG found: Cronus-$CURRENT_VERSION-arm64.dmg"
    DMG_DATE=$(echo $DMG_EXISTS | awk '{print $1, $2}')
    echo "   Published: $DMG_DATE"
else
    echo "❌ DMG not found: Cronus-$CURRENT_VERSION-arm64.dmg"
fi

if [ -n "$ZIP_EXISTS" ]; then
    echo "✅ ZIP found: Cronus-$CURRENT_VERSION-arm64-mac.zip"
    ZIP_DATE=$(echo $ZIP_EXISTS | awk '{print $1, $2}')
    echo "   Published: $ZIP_DATE"
else
    echo "❌ ZIP not found: Cronus-$CURRENT_VERSION-arm64-mac.zip"
fi

echo ""
echo "Checking latest links:"

# Check if latest files exist
LATEST_DMG_EXISTS=$(aws s3 ls "s3://$BUCKET_NAME/Cronus-latest.dmg" 2>/dev/null || echo "")
LATEST_ZIP_EXISTS=$(aws s3 ls "s3://$BUCKET_NAME/Cronus-latest.zip" 2>/dev/null || echo "")

if [ -n "$LATEST_DMG_EXISTS" ]; then
    echo "✅ Latest DMG link exists"
    LATEST_DMG_DATE=$(echo $LATEST_DMG_EXISTS | awk '{print $1, $2}')
    echo "   Updated: $LATEST_DMG_DATE"
else
    echo "❌ Latest DMG link not found"
fi

if [ -n "$LATEST_ZIP_EXISTS" ]; then
    echo "✅ Latest ZIP link exists"
    LATEST_ZIP_DATE=$(echo $LATEST_ZIP_EXISTS | awk '{print $1, $2}')
    echo "   Updated: $LATEST_ZIP_DATE"
else
    echo "❌ Latest ZIP link not found"
fi

echo ""
echo "Download URLs:"
echo "DMG: https://$BUCKET_NAME.s3.amazonaws.com/Cronus-latest.dmg"
echo "ZIP: https://$BUCKET_NAME.s3.amazonaws.com/Cronus-latest.zip"

# Check if everything is published and up to date
if [ -n "$DMG_EXISTS" ] && [ -n "$ZIP_EXISTS" ] && [ -n "$LATEST_DMG_EXISTS" ] && [ -n "$LATEST_ZIP_EXISTS" ]; then
    echo ""
    echo "🎉 Version $CURRENT_VERSION is fully published and latest links are updated!"
else
    echo ""
    echo "⚠️  Version $CURRENT_VERSION is not fully published yet."
fi 