import Baker from 'cronbake';
import { User as UserModel } from '../../models/user';
import { getCalendarEvents } from '../googleCalendar';
import { generateSuggestionsForUser } from '../suggestions/suggestionGenerationService';

export function startSuggestionCronJob() {
  const baker = Baker.create();

  baker.add({
    name: 'generate-suggestions',
    cron: '@hourly',
    callback: async () => {
      console.log('🕒 [CRON] Running suggestion generation job...');
      try {
        const users = await UserModel.find({
          googleRefreshToken: { $ne: null },
          hasCalendarAccess: true,
        }).lean();

        console.log(`[CRON] Found ${users.length} users with calendar access.`);

        for (const user of users) {
          try {
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(endDate.getDate() - 3);
            startDate.setHours(0, 0, 0, 0);

            const calendarEvents = await getCalendarEvents(user._id.toString(), startDate, endDate);

            if (calendarEvents.length === 0) {
              console.log(
                `[CRON] No calendar events for ${user.email} in the last 3 days. Skipping.`
              );
              continue;
            }

            const transformedEvents = calendarEvents.map((e) => ({
              id: e.id,
              summary: e.summary,
              description: e.description || '',
              startTime: new Date(e.start.dateTime || e.start.date!).getTime(),
              endTime: new Date(e.end.dateTime || e.end.date!).getTime(),
            }));

            const result = await generateSuggestionsForUser(user._id.toString(), transformedEvents);
            console.log(`[CRON] Generated ${result.created} suggestions for ${user.email}.`);
          } catch (error) {
            console.error(`[CRON] Error processing user ${user.email}:`, error);
          }
        }
      } catch (error) {
        console.error('[CRON] Error fetching users for suggestion generation:', error);
      }
      console.log('✅ [CRON] Suggestion generation job finished.');
    },
  });

  baker.bakeAll();

  console.log('🔥 Cron job for suggestions scheduled.');
}
