import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { ActiveWindowEventModel } from '../models/activeWindowEvent';
import { UserModel } from '../models/user';

const envPath =
  process.env.NODE_ENV === 'production'
    ? path.resolve(__dirname, '../../../.env.production')
    : path.resolve(__dirname, '../../../.env');

dotenv.config({ path: envPath });

async function run() {
  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) {
    console.error('MONGO_URI is not defined in the environment variables');
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGO_URI);
    console.log(`Connected to MongoDB`);

    // Calculate 48 hours ago
    const now = new Date();
    const fortyEightHoursAgo = new Date(now.getTime() - (48 * 60 * 60 * 1000));
    
    console.log(`Checking for uncategorized events from ${fortyEightHoursAgo.toISOString()} to ${now.toISOString()}`);

    // Count events without categoryId in the last 48 hours
    const uncategorizedCount = await ActiveWindowEventModel.countDocuments({
      timestamp: { $gte: fortyEightHoursAgo.getTime(), $lte: now.getTime() },
      $or: [
        { categoryId: { $exists: false } },
        { categoryId: null },
        { categoryId: '' }
      ]
    });

    // Count total events in the last 48 hours for comparison
    const totalCount = await ActiveWindowEventModel.countDocuments({
      timestamp: { $gte: fortyEightHoursAgo.getTime(), $lte: now.getTime() }
    });

    console.log(`\n📊 Results for the last 48 hours:`);
    console.log(`🔍 Total events: ${totalCount}`);
    console.log(`❌ Uncategorized events: ${uncategorizedCount}`);
    console.log(`✅ Categorized events: ${totalCount - uncategorizedCount}`);
    
    if (totalCount > 0) {
      const uncategorizedPercentage = ((uncategorizedCount / totalCount) * 100).toFixed(1);
      console.log(`📈 Uncategorized percentage: ${uncategorizedPercentage}%`);
    }

    // Also check events that might have failed during categorization (have lastCategorizationAt but no categoryId)
    const failedCategorizationCount = await ActiveWindowEventModel.countDocuments({
      timestamp: { $gte: fortyEightHoursAgo.getTime(), $lte: now.getTime() },
      lastCategorizationAt: { $exists: true },
      $or: [
        { categoryId: { $exists: false } },
        { categoryId: null },
        { categoryId: '' }
      ]
    });

    console.log(`🚨 Events that failed categorization (have lastCategorizationAt but no categoryId): ${failedCategorizationCount}`);

  } catch (error) {
    console.error('Error connecting to MongoDB or running script:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

run();