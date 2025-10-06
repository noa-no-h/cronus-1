# Hugging Face LLM Integration for Cronus

This module provides an alternative implementation of the LLM service using Hugging Face models instead of OpenAI/Cerebras.

## Setup

1. Create a Hugging Face account at https://huggingface.co/
2. Obtain a Hugging Face API key from https://huggingface.co/settings/tokens
3. Add the API key to your server's `.env` file:
   ```
   HUGGINGFACE_API_KEY=your_api_key_here
   ```

## Available Models

The implementation uses models available through the Hugging Face Router API, which acts as a drop-in replacement for OpenAI's API. The default models include:

- deepseek-ai/DeepSeek-V3-0324
- meta-llama/Meta-Llama-3-8B-Instruct
- mistralai/Mistral-7B-Instruct-v0.2
- google/gemma-7b-it

You can also specify a specific provider with the model name by using the format: `modelName: "model:provider"` (e.g., `"deepseek-ai/DeepSeek-V3-0324:nebius"`).

## Usage

```typescript
import {
  getHuggingFaceCategoryChoice,
  getHuggingFaceSummaryForBlock,
  isTitleInformative,
  generateActivitySummary,
  getEmojiForCategory
} from './services/categorization/llm-huggingface';

// Example: Get category choice
const categoryChoice = await getHuggingFaceCategoryChoice(
  userProjectsAndGoals,
  userCategories,
  activityDetails
);

// Example: Get summary
const summary = await getHuggingFaceSummaryForBlock(activityDetails);
```

## How It Works: Router API

This implementation uses Hugging Face's Router API which acts as a drop-in replacement for OpenAI's API. This allows us to use the existing OpenAI SDK with Hugging Face models by simply changing the base URL.

```typescript
const huggingFaceClient = new OpenAI({
  baseURL: 'https://router.huggingface.co/v1',
  apiKey: process.env.HUGGINGFACE_API_KEY || '',
  defaultHeaders: {
    'User-Agent': 'Cronus Productivity Tracker',
  },
});
```

## Key Features

1. **OpenAI SDK Compatible**: Uses the OpenAI SDK with a different base URL, making it a drop-in replacement.

2. **Token Usage Tracking**: Unlike the direct Inference API, the Router API returns token usage information, allowing for accurate tracking.

3. **Model Failover**: Maintains model failover approach, automatically switching to different models if one fails.

4. **Response Cleaning**: Includes logic to clean up responses if they come with markdown formatting.

## Adding New Models

To add a new model:

1. Update the `availableModels` array in `llm-huggingface.ts` with the new model information.
2. Ensure the model is accessible through the Hugging Face Router API.

Example:
```typescript
{
  provider: 'huggingface',
  modelName: 'your-model-name',
}
```

## Benefits of Router API Approach

1. **Simplicity**: Uses OpenAI SDK with a different base URL, requiring minimal code changes
2. **Compatibility**: Works with all OpenAI-compatible endpoints
3. **Reliability**: Automatic fallbacks to different models if one fails
4. **Flexibility**: Can use different providers by specifying in the model name