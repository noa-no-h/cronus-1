# Troubleshooting Hugging Face Integration

If you're experiencing issues with the Hugging Face integration, here are some common problems and solutions:

## 404 Not Found Errors

If you see errors like `Hugging Face API error (404): Not Found`, it means the models you're trying to access either:
- Don't exist on the Inference API
- Require special permissions
- Require a Pro/paid account

### Solutions:

#### 1. Use Endpoints API

Instead of using the general Inference API, you can use a specific endpoint API that's definitely available:

```typescript
// In llm-huggingface.ts
const availableModels: ModelConfig[] = [
  {
    provider: 'huggingface',
    modelName: 'Inference API Endpoint',
    apiURL: 'https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2',
    estimatedUsage: estimateTokenUsage
  }
];
```

#### 2. Deploy Your Own Model

You can deploy your own model to the Hugging Face Inference API:

1. Go to https://huggingface.co/models
2. Find a model you want to use
3. Click "Deploy" → "Inference API"
4. Follow the instructions to deploy the model
5. Use the endpoint URL provided in your code

#### 3. Check Model Access

Make sure the models you're trying to access are:
- Public models that allow inference API access
- Models you've been granted access to
- Models compatible with text generation tasks

## 401 Invalid Credentials

If you see errors like `Hugging Face API error (401): Invalid credentials`, it means your API key is not valid.

### Solutions:

1. Double-check your API key format (should start with `hf_`)
2. Generate a new API key at https://huggingface.co/settings/tokens
3. Make sure the key has the correct permissions (read)

## Testing Your API Key

You can test your API key with a simple curl command:

```bash
curl -X POST \
  https://api-inference.huggingface.co/models/gpt2 \
  -H "Authorization: Bearer hf_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"inputs": "Hello, I am a"}'
```

If this works, you'll get a response like:
```json
[{"generated_text": "Hello, I am a bit of a mess. I'm not sure what to do with myself."}]
```

## Alternative: Use a Model on the Inference API Playground

Another way to test which models are available to you is to:

1. Go to https://huggingface.co/inference-api
2. See which models are available in the dropdown
3. Test them in the playground
4. Use those model names in your code