import fs from 'fs/promises';
import path from 'path';

// Log file will be created in the `server` directory, e.g., /server/server.log
const logFilePath = path.join(__dirname, '../../server.log');

// A simple initialization check to avoid re-initializing on every call
let loggerInitialized = false;

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
      logEntry += `\n${JSON.stringify(data, null, 2)}`;
    } catch (e) {
      logEntry += `\n[Could not stringify data]`;
    }
  }
  try {
    await fs.appendFile(logFilePath, logEntry + '\n');
  } catch (err) {
    console.error('Failed to write to server log file:', err);
  }
};
