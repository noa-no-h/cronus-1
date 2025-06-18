#!/bin/bash
set -e

echo "🧹 Starting cleanup of existing Cronus installation..."

# 1. Delete the installed application from the /Applications folder
if [ -d "/Applications/Cronus.app" ]; then
  echo "🗑️ Removing existing Cronus.app from /Applications..."
  rm -rf "/Applications/Cronus.app"
  echo "✅ Cronus.app removed."
else
  echo "🤷 Cronus.app not found in /Applications, skipping."
fi

# 2. Reset permissions (TCC database)
# This will force macOS to re-prompt for these permissions on next launch.
# The '|| true' ensures the script doesn't fail if permissions were never granted.
echo "🔐 Resetting AppleEvents and Accessibility permissions for com.cronus.app..."
tccutil reset AppleEvents com.cronus.app || true
tccutil reset Accessibility com.cronus.app || true
echo "✅ Permissions reset."

echo "✨ Cleanup complete!" 