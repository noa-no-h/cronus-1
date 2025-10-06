# Setting Up Hugging Face API Access

To use the Hugging Face LLM implementation, you need a valid API key.

## Getting a Hugging Face API Key

1. Go to https://huggingface.co/ and sign up or log in
2. Navigate to Settings → Access Tokens: https://huggingface.co/settings/tokens
3. Click "New token"
4. Give your token a name (e.g., "Cronus API")
5. Select "Read" access
6. Click "Generate token"
7. Copy the token (it starts with `hf_`)

## Adding the API Key to Your Project

### Option 1: Add to .env file
Add the following line to your `.env` file in the server directory:
```
HUGGINGFACE_API_KEY=hf_your_token_here
```

### Option 2: Set as environment variable
```bash
export HUGGINGFACE_API_KEY=hf_your_token_here
```

## Testing the Integration

Run the test script:
```bash
cd /Users/noa/cronus2/server
bun run src/services/categorization/llm-example.ts
```

## Troubleshooting

If you see "Invalid credentials" errors, check that:
1. You've copied the full API token correctly
2. The token is properly set in your .env file or as an environment variable
3. The token has not expired or been revoked

## Using Pro Models (Optional)

Some models like Llama-2-13b or Mistral require a Pro subscription. 
If you have Pro access, you can use these models directly.

If you don't have Pro access, you can use free models like:
- microsoft/phi-2
- TheBloke/Llama-2-7B-Chat-GGUF
- google/flan-t5-small