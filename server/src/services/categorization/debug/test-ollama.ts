import { getCategoryChoice } from '../llm-impl';

async function testOllama() {
  console.log('Testing Ollama integration...');

  try {
    const result = await getCategoryChoice(
      'Test activity: Working on a coding project',
      [
        { id: 'test1', name: 'Programming', description: 'Coding activities' },
        { id: 'test2', name: 'Writing', description: 'Writing activities' }
      ],
      'test-user-id'
    );

    console.log('✅ Ollama test successful!');
    console.log('Result:', result);
  } catch (error) {
    console.error('❌ Ollama test failed:', error);
  }
}

testOllama();