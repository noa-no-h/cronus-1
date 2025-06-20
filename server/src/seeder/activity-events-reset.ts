import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import * as readline from 'readline';
import { ActiveWindowEventModel } from '../models/activeWindowEvent';
import { User } from '../models/user';

const envPath =
  process.env.NODE_ENV === 'production'
    ? path.resolve(__dirname, '../../../.env.production')
    : path.resolve(__dirname, '../../../.env');

// Load environment variables from .env file
dotenv.config({ path: envPath });

function askQuestion(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) =>
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans);
    })
  );
}

async function run() {
  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) {
    console.error('MONGO_URI is not defined in the environment variables');
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGO_URI);
    console.log(`Connected to MongoDB: ${MONGO_URI}`);

    const userEmail = 'wallawitsch@gmail.com';
    const user = await User.findOne({ email: userEmail });

    if (!user) {
      console.log(`User with email ${userEmail} not found.`);
      return;
    }

    console.log(`Found user: ${user.email} with id ${user._id}`);

    const cutoffDate = new Date('2025-06-20T07:00:00.000Z'); // June 20, 2025 in PT (PDT is UTC-7)

    const count = await ActiveWindowEventModel.countDocuments({
      userId: user._id,
      timestamp: { $lt: cutoffDate },
    });

    if (count === 0) {
      console.log(`No activity window events to delete for user ${userEmail}.`);
      return;
    }

    const confirmation = await askQuestion(
      `This will delete ${count} activity entries for ${userEmail} before ${cutoffDate.toDateString()}.\nAre you sure you want to proceed? Type "yes" to confirm: `
    );

    if (confirmation.trim() !== 'yes') {
      console.log('Aborting.');
      return;
    }

    const result = await ActiveWindowEventModel.deleteMany({
      userId: user._id,
      timestamp: { $lt: cutoffDate },
    });

    console.log(`Deleted ${result.deletedCount} activity window events for user ${userEmail}.`);
  } catch (error) {
    console.error('Error connecting to MongoDB or running script:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

run();
