import dotenv from 'dotenv';
dotenv.config();

import { calendar_v3 } from 'googleapis';
import mongoose from 'mongoose';
import { UserModel } from '../models/user';
import { getCalendarEvents } from '../services/googleCalendar';
import { generateSuggestionsForUser } from '../services/suggestions/suggestionGenerationService';

console.log('in generate suggestions script MONGODB_URI', process.env.MONGODB_URI);

function isNotNull<T>(value: T | null): value is T {
  return value !== null;
}

const DAYS_IN_PAST_RANGE = 3;

async function run() {
  await mongoose.connect(process.env.MONGODB_URI!);

  console.log('🕒 Running suggestion generation script...');
  try {
    const users = await UserModel.find({
      googleRefreshToken: { $ne: null },
      hasCalendarAccess: true,
    }).lean();

    console.log(`Found ${users.length} users with calendar access.`);

    for (const user of users) {
      try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - DAYS_IN_PAST_RANGE);
        startDate.setHours(0, 0, 0, 0);

        const calendarEvents = await getCalendarEvents(user._id.toString(), startDate, endDate);

        if (calendarEvents.length === 0) {
          console.log(`No calendar events for ${user.email} in the last 3 days. Skipping.`);
          continue;
        }

        const transformedEvents = calendarEvents
          .map((e: calendar_v3.Schema$Event) => {
            if (!e.start || !e.end) {
              return null;
            }
            return {
              id: e.id ?? '',
              summary: e.summary ?? '',
              description: e.description || '',
              startTime: new Date(e.start.dateTime || e.start.date!).getTime(),
              endTime: new Date(e.end.dateTime || e.end.date!).getTime(),
            };
          })
          .filter(isNotNull);

        if (transformedEvents.length === 0) {
          console.log(
            `[CRON] No valid calendar events for ${user.email} in the last 3 days after filtering. Skipping.`
          );
          continue;
        }

        const result = await generateSuggestionsForUser(user._id.toString(), transformedEvents);
        console.log(`Generated ${result.created} suggestions for ${user.email}.`);
      } catch (error) {
        console.error(`Error processing user ${user.email}:`, error);
      }
    }
  } catch (error) {
    console.error('Error fetching users for suggestion generation:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Suggestion generation script finished.');
  }
}

run().catch((error) => {
  console.error('Unhandled error in suggestion generation script:', error);
  process.exit(1);
});
