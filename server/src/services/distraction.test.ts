import { ActiveWindowDetails } from '@shared/types';
import { beforeEach, describe, expect, test } from 'bun:test'; // vi is removed
import { determineDistraction, DistractionDeterminationResult } from './distractions';

// No more OpenAI mocking, we are making live API calls.
// Ensure OPENAI_API_KEY is set in your environment.

function logTestResult(testName: string, result: DistractionDeterminationResult) {
  console.log(`\n--- Test: ${testName} ---`);
  console.log(`Is Distraction: ${result.isDistraction}`);
  console.log(`Motivational Text: "${result.motivationalText}"`);
  console.log(`---------------------------\n`);
}

describe('determineDistraction - Developer Persona', () => {
  const developerUserGoals = {
    dailyGoal: 'Finish coding the new feature for project X',
    weeklyGoal: 'Deploy version 2.0 of project X',
    lifeGoal: 'Build a successful SaaS company',
  };

  // Note: beforeEach is not strictly necessary anymore without mocks to reset,
  // but can be kept if you add other setup logic later.
  beforeEach(() => {
    // Placeholder if any common setup is needed for live tests
  });

  test('should identify a productive coding app (Cursor) as "no" distraction', async () => {
    const testName = 'Developer: Productive - Cursor';
    const activeWindow: Partial<ActiveWindowDetails> = {
      // Using Partial as windowId and timestamp are omitted
      ownerName: 'Cursor',
      type: 'window',
      title: 'Refactoring payment_service.ts in project X',
      url: null,
    };
    const result = await determineDistraction(
      developerUserGoals,
      activeWindow as ActiveWindowDetails
    );
    logTestResult(testName, result);
    expect(result.isDistraction).toBe('no');
    expect(typeof result.motivationalText).toBe('string');
  }, 30000); // Increased timeout for combined API call

  test('should identify YouTube (unrelated) as "yes" distraction', async () => {
    const testName = 'Developer: Distraction - YouTube Cats';
    const activeWindow: Partial<ActiveWindowDetails> = {
      ownerName: 'Google Chrome',
      type: 'browser',
      browser: 'chrome',
      title: 'Top 10 Funniest Cat Videos of the Year',
      url: 'https://www.youtube.com/watch?v=somecatvideo',
    };
    const result = await determineDistraction(
      developerUserGoals,
      activeWindow as ActiveWindowDetails
    );
    logTestResult(testName, result);
    expect(result.isDistraction).toBe('yes');
    expect(typeof result.motivationalText).toBe('string');
    expect(result.motivationalText.length).toBeGreaterThan(5); // Expect some message
  }, 30000);

  test('should identify Coinbase as "yes" distraction during coding time', async () => {
    const testName = 'Developer: Distraction - Coinbase';
    const activeWindow: Partial<ActiveWindowDetails> = {
      ownerName: 'Google Chrome',
      type: 'browser',
      browser: 'chrome',
      title: 'My Coinbase Portfolio - Live Updates',
      url: 'https://www.coinbase.com/portfolio',
    };
    const result = await determineDistraction(
      developerUserGoals,
      activeWindow as ActiveWindowDetails
    );
    logTestResult(testName, result);
    expect(result.isDistraction).toBe('yes');
    expect(typeof result.motivationalText).toBe('string');
    expect(result.motivationalText.length).toBeGreaterThan(5);
  }, 30000);
});

// Recruiter Persona

describe('determineDistraction - Recruiter Persona', () => {
  const recruiterUserGoals = {
    dailyGoal: 'Find 5 qualified candidates for Senior Software Engineer role',
    weeklyGoal: 'Schedule interviews with 10 potential hires',
    lifeGoal: 'Become a top Head of Talent at a leading tech company',
  };

  test('should identify LinkedIn Recruiter as "no" distraction for a recruiter', async () => {
    const testName = 'Recruiter: Productive - LinkedIn Recruiter';
    const activeWindow: Partial<ActiveWindowDetails> = {
      ownerName: 'Google Chrome',
      type: 'browser',
      browser: 'chrome',
      title: 'Messaging candidates on LinkedIn Recruiter',
      url: 'https://www.linkedin.com/recruiter/projects',
    };
    const result = await determineDistraction(
      recruiterUserGoals,
      activeWindow as ActiveWindowDetails
    );
    logTestResult(testName, result);
    expect(result.isDistraction).toBe('no');
    expect(typeof result.motivationalText).toBe('string');
  }, 30000);

  test('should identify a coding tutorial site (e.g., freeCodeCamp) as "yes" distraction for a recruiter', async () => {
    const testName = 'Recruiter: Distraction - freeCodeCamp';
    const activeWindow: Partial<ActiveWindowDetails> = {
      ownerName: 'Google Chrome',
      type: 'browser',
      browser: 'chrome',
      title: 'Learn JavaScript Algorithms - freeCodeCamp',
      url: 'https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/',
    };
    const result = await determineDistraction(
      recruiterUserGoals,
      activeWindow as ActiveWindowDetails
    );
    logTestResult(testName, result);
    expect(result.isDistraction).toBe('yes');
    expect(typeof result.motivationalText).toBe('string');
    expect(result.motivationalText.length).toBeGreaterThan(5);
  }, 30000);

  test('should identify a general news site as "yes" or "maybe" for a recruiter', async () => {
    const testName = 'Recruiter: Ambiguous - TechCrunch';
    const activeWindow: Partial<ActiveWindowDetails> = {
      ownerName: 'Google Chrome',
      type: 'browser',
      browser: 'chrome',
      title: 'Tech News Today - TechCrunch',
      url: 'https://techcrunch.com',
    };
    const result = await determineDistraction(
      recruiterUserGoals,
      activeWindow as ActiveWindowDetails
    );
    logTestResult(testName, result);
    expect(['yes', 'maybe']).toContain(result.isDistraction);
    expect(typeof result.motivationalText).toBe('string');
  }, 30000);

  test('should identify email client (Gmail) as "no", "maybe", or "yes" for a recruiter', async () => {
    const testName = 'Recruiter: Ambiguous - Gmail';
    const activeWindow: Partial<ActiveWindowDetails> = {
      ownerName: 'Google Chrome',
      type: 'browser',
      browser: 'chrome',
      title: 'Inbox - jane.doe@example.com - Gmail',
      url: 'https://mail.google.com/',
    };
    const result = await determineDistraction(
      recruiterUserGoals,
      activeWindow as ActiveWindowDetails
    );
    logTestResult(testName, result);
    expect(['no', 'maybe', 'yes']).toContain(result.isDistraction);
    expect(typeof result.motivationalText).toBe('string');
  }, 30000);
});
