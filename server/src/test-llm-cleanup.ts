// Test for JSON parsing with Markdown code blocks
import { cleanLLMResponse } from './services/categorization/llm';

// Test different markdown-formatted responses
function testCleanLLMResponse() {
  const testCases = [
    {
      input: '```json\n{"key": "value"}\n```',
      expected: '{"key": "value"}'
    },
    {
      input: '```\n{"key": "value"}\n```',
      expected: '{"key": "value"}'
    },
    {
      input: 'Some text before ```json\n{"key": "value"}\n``` some text after',
      expected: '{"key": "value"}'
    },
    {
      input: '{"key": "value"}',
      expected: '{"key": "value"}'
    },
    // Additional test cases for incomplete markdown
    {
      input: '```json\n{"category": "Research", "reason": "Reading documentation"}',
      expected: '{"category": "Research", "reason": "Reading documentation"}'
    },
    {
      input: '{"category": "Meeting", "reason": "Video conference"}\n```',
      expected: '{"category": "Meeting", "reason": "Video conference"}'
    }
  ];

  testCases.forEach((testCase, index) => {
    const cleaned = cleanLLMResponse(testCase.input);
    const success = cleaned === testCase.expected;
    
    console.log(`Test case ${index + 1}: ${success ? 'PASSED' : 'FAILED'}`);
    if (!success) {
      console.log(`  Expected: "${testCase.expected}"`);
      console.log(`  Actual:   "${cleaned}"`);
    }
  });
}

// Run the test
testCleanLLMResponse();