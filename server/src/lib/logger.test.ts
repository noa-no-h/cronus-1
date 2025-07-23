import { scrub, findSensitiveValues } from '@zapier/secret-scrubber';

// Helper to filter out emails
function filterOutEmails(sensitive: string[]): string[] {
  const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
  return sensitive.filter((val) => !emailRegex.test(val));
}

const data = {
  email: 'user@example.com',
  password: 'hunter2',
  apiKey: 'sk-1234567890abcdef',
  message: 'Contact me at user@example.com and use password hunter2',
};

const sensitive = findSensitiveValues(data);
const filteredSensitive = filterOutEmails(sensitive);
const cleanData = scrub(data, filteredSensitive);

console.log('Scrubbed data:', cleanData);

// Simple assertion (optional, for Bun's test runner)
if (
  cleanData.email !== 'user@example.com' ||
  cleanData.password.includes(':censored:') === false ||
  cleanData.apiKey.includes(':censored:') === false ||
  cleanData.message.includes('user@example.com') === false ||
  cleanData.message.includes(':censored:') === false
) {
  throw new Error('Secret scrubbing test failed!');
}
