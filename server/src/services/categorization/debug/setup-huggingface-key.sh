#!/usr/bin/env bash

# Script to add or update Hugging Face API key in .env file (moved to debug/)

# Determine the server directory path
SERVER_DIR="$(pwd)/server"

# Check if we're already in the server directory
if [[ "$(pwd)" == */server ]]; then
  SERVER_DIR="$(pwd)"
fi

# Check if server directory exists
if [ ! -d "$SERVER_DIR" ]; then
  echo "Error: Server directory not found at $SERVER_DIR"
  exit 1
fi

# Path to .env file
ENV_FILE="$SERVER_DIR/.env"

# Prompt for API key
echo "Enter your Hugging Face API key:"
read API_KEY

# Validate input
if [ -z "$API_KEY" ]; then
  echo "Error: No API key provided. Exiting."
  exit 1
fi

# Check if .env file exists
if [ -f "$ENV_FILE" ]; then
  # Check if HUGGINGFACE_API_KEY already exists in the file
  if grep -q "HUGGINGFACE_API_KEY=" "$ENV_FILE"; then
    # Replace existing key
    sed -i '' "s/HUGGINGFACE_API_KEY=.*/HUGGINGFACE_API_KEY=$API_KEY/" "$ENV_FILE"
    echo "Updated existing HUGGINGFACE_API_KEY in $ENV_FILE"
  else
    # Append new key
    echo "HUGGINGFACE_API_KEY=$API_KEY" >> "$ENV_FILE"
    echo "Added HUGGINGFACE_API_KEY to $ENV_FILE"
  fi
else
  # Create new .env file
  echo "HUGGINGFACE_API_KEY=$API_KEY" > "$ENV_FILE"
  echo "Created new $ENV_FILE file with HUGGINGFACE_API_KEY"
fi

echo "Hugging Face API key has been configured successfully."
echo "You can now run the test with: bun run server/src/services/categorization/debug/test-router-api.ts"
