import fs from 'fs/promises';
import path from 'path';
import { scrub, findSensitiveValues } from '@zapier/secret-scrubber';

// Log file will be created in the `server` directory, e.g., /server/server.log
const logFilePath = path.join(__dirname, '../../server.log');

// A simple initialization check to avoid re-initializing on every call
let loggerInitialized = false;

// function to filter out emails
function filterOutEmails(sensitive: string[]): string[] {
  // Simple email regex
  const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
  return sensitive.filter((val) => !emailRegex.test(val));
}

async function initializeLogger(): Promise<void> {
  if (loggerInitialized) return;
  try {
    await fs.writeFile(logFilePath, `--- Server Log started at ${new Date().toISOString()} ---\n`);
    loggerInitialized = true;
  } catch (err) {
    console.error('Failed to initialize server log file:', err);
  }
}

export const logToFile = async (message: string, data?: object): Promise<void> => {
  if (!loggerInitialized) {
    await initializeLogger();
  }

  const timestamp = new Date().toISOString();
  let logEntry = `${timestamp} - ${message}`;
  if (data) {
    try {
      const sensitive = findSensitiveValues(data);
      const filteredSensitive = filterOutEmails(sensitive);
      const cleanData = scrub(data, filteredSensitive);
      logEntry += `\n${JSON.stringify(cleanData, null, 2)}`;
    } catch (e) {
      console.error('Failed to stringify data:', e);
      logEntry += `\n[Could not stringify data]`;
    }
  }
  logToFile('Test log', {
    email: 'user@example.com',
    password: 'hunter2',
    apiKey: 'sk-1234567890abcdef',
    message: 'Contact me at user@example.com and use password hunter2',
  });
  try {
    await fs.appendFile(logFilePath, logEntry + '\n');
  } catch (err) {
    console.error('Failed to write to server log file:', err);
  }
};
