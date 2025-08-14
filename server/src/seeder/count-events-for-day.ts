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

    const userEmail = 'wallawitsch@gmail.com';
    const user = await UserModel.findOne({ email: userEmail });

    if (!user) {
      console.log(`User with email ${userEmail} not found.`);
      return;
    }

    console.log(`Found user: ${user.email} with id ${user._id}`);

    // Set the date range for August 12th, 2024
    const startDate = new Date('2025-08-12T00:00:00.000Z');
    const endDate = new Date('2025-08-13T00:00:00.000Z');

    console.log(
      `Counting events for user ${userEmail} between ${startDate.toISOString()} and ${endDate.toISOString()}`
    );

    const count = await ActiveWindowEventModel.countDocuments({
      userId: user._id,
      timestamp: { $gte: startDate.getTime(), $lt: endDate.getTime() },
    });

    console.log(`\n✅ Found ${count} ActiveWindowEvent(s) for ${userEmail} on August 12th, 2024.`);
  } catch (error) {
    console.error('Error connecting to MongoDB or running script:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

run();
