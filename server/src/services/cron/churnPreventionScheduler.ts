import Baker from 'cronbake';
import { LoopsClient } from 'loops';
import { ActiveWindowEventModel } from '../../models/activeWindowEvent';
import { UserModel } from '../../models/user';

const loops = new LoopsClient(process.env.LOOPS_API_KEY!);

export function startChurnPreventionCronJob() {
  const baker = Baker.create();

  baker.add({
    name: 'churn-prevention-email',
    cron: '0 12 * * *', // Run daily at 12 PM
    callback: async () => {
      console.log('📧 [CHURN PREVENTION] Running churn prevention email job...');

      try {
        // Don't send churn emails on weekends - people might just be taking a break
        const now = new Date();
        const isWeekend = now.getDay() === 0 || now.getDay() === 6; // 0 = Sunday, 6 = Saturday

        if (isWeekend) {
          console.log('[CHURN PREVENTION] Skipping churn emails on weekend');
          return;
        }

        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000; // 24 hours ago

        // Find users who have never been sent a churn email
        const users = await UserModel.find({
          lastChurnEmailSent: { $exists: false },
        }).lean();

        console.log(`[CHURN PREVENTION] Found ${users.length} users to check for inactivity.`);

        let emailsSent = 0;
        let usersChecked = 0;

        for (const user of users) {
          try {
            usersChecked++;

            // Check if user has had any activity in the last 24 hours
            const recentActivity = await ActiveWindowEventModel.findOne({
              userId: user._id.toString(),
              timestamp: { $gte: oneDayAgo },
            }).lean();

            if (recentActivity) {
              // User has recent activity, skip
              continue;
            }

            // User hasn't been active in the last 24 hours
            // Send churn prevention email
            const firstName = user.name ? user.name.split(' ')[0] : '';

            await loops.sendTransactionalEmail({
              transactionalId: 'cmd82afmp0yv4yx0iywbgtg7d',
              email: user.email,
              dataVariables: {
                datavariable: firstName,
              },
            });

            // Update user's lastChurnEmailSent timestamp
            await UserModel.findByIdAndUpdate(user._id, {
              lastChurnEmailSent: new Date(),
            });

            emailsSent++;
            console.log(`[CHURN PREVENTION] Sent churn prevention email to ${user.email}`);
          } catch (error) {
            console.error(`[CHURN PREVENTION] Error processing user ${user.email}:`, error);
          }
        }

        console.log(
          `[CHURN PREVENTION] Checked ${usersChecked} users, sent ${emailsSent} churn prevention emails.`
        );
      } catch (error) {
        console.error('[CHURN PREVENTION] Error in churn prevention job:', error);
      }

      console.log('✅ [CHURN PREVENTION] Churn prevention email job finished.');
    },
  });

  baker.bakeAll();
  console.log('📧 Churn prevention email cron job scheduled.');
}
