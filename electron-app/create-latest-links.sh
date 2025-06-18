#!/bin/bash
set -e

BUCKET_NAME="cronusnewupdates"
CURRENT_VERSION=$(node -p "require('./package.json').version")

echo "Creating latest download links for version $CURRENT_VERSION"

aws s3 cp "s3://$BUCKET_NAME/Cronus-$CURRENT_VERSION-arm64.dmg" "s3://$BUCKET_NAME/Cronus-latest.dmg" --metadata-directive REPLACE --acl public-read
aws s3 cp "s3://$BUCKET_NAME/Cronus-$CURRENT_VERSION-arm64-mac.zip" "s3://$BUCKET_NAME/Cronus-latest.zip" --metadata-directive REPLACE --acl public-read

echo "Latest download links updated!"
echo "DMG: https://$BUCKET_NAME.s3.amazonaws.com/Cronus-latest.dmg"
echo "ZIP: https://$BUCKET_NAME.s3.amazonaws.com/Cronus-latest.zip"