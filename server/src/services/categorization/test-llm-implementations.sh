#!/bin/bash

# Check if HUGGINGFACE_API_KEY is set
if [ -z "$HUGGINGFACE_API_KEY" ]; then
  echo "⚠️  HUGGINGFACE_API_KEY environment variable is not set."
  echo "Please obtain a Hugging Face API key from https://huggingface.co/settings/tokens"
  echo "and set it as an environment variable:"
  echo "export HUGGINGFACE_API_KEY=your_api_key_here"
  exit 1
fi

echo "Running LLM implementation test..."
cd "$(dirname "$0")/../../../" # Navigate to server directory
bun run src/services/categorization/llm-example.ts