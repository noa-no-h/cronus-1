# Gemini API Integration for Cronus

This document explains how to set up and use the Google Gemini API with Cronus.

## Overview

Cronus now supports Google's Gemini API as an alternative to OpenAI or Hugging Face for AI-powered categorization and summarization. The Gemini integration uses the OpenAI-compatible endpoint of Gemini, allowing it to work with minimal changes to the existing OpenAI client.

## Setup

### 1. Get a Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account
3. Navigate to the API Keys section
4. Create a new API key
5. Copy the key for use in the next step

### 2. Configure Environment Variables

Add your Gemini API key to your environment:

```
GEMINI_API_KEY=your_api_key_here
```

You can add this to your `.env` file or set it in your environment before running the app.

### 3. Enable the Gemini Provider

You can switch to Gemini in one of three ways:

#### Option A: Edit the source code

Open `server/src/services/categorization/llm-impl.ts` and change:

```typescript
const forceImplementation: 'openai' | 'huggingface' | 'gemini' | null = 'gemini';
```

#### Option B: Set an environment variable

```
LLM_IMPLEMENTATION=gemini
```

#### Option C: Use the runtime API

```typescript
import { setLLMProvider } from './services/categorization/llm-provider';

setLLMProvider('gemini');
```

## Available Models

The Gemini integration includes these models:

1. `gemini-2.0-flash` - Fastest model with good performance for most tasks
2. `gemini-2.0-pro` - More capable model for complex reasoning
3. `gemini-1.5-flash` - Fallback model

The system automatically tries different models if one fails.

## Privacy Protection

The Gemini integration uses the same redaction system as other providers in Cronus. Before sending any data to the API, the system:

1. Redacts sensitive information (credit cards, SSNs, emails, etc.)
2. Truncates long content
3. Sanitizes URLs and other potentially sensitive fields

## Troubleshooting

If you encounter issues with the Gemini integration:

1. Verify your API key is correct
2. Check that your account has access to the Gemini API
3. Look for error messages in the console logs
4. Try switching to a different provider temporarily

## Token Usage

Token usage is tracked and estimated for the Gemini API, though the token counts are approximate since the OpenAI-compatible endpoint doesn't return exact token counts.

## Support

For issues with the Gemini integration, please check the Cronus repository issues or create a new issue describing the problem.