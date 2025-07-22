import Baker from 'cronbake';
import { LoopsClient } from 'loops';
import { ActiveWindowEventModel } from '../../models/activeWindowEvent';
import { UserModel } from '../../models/user';

const loops = new LoopsClient(process.env.LOOPS_API_KEY!);

export function startChurnPreventionCronJob() {
  const baker = Baker.create();

  baker.add({
    name: 'churn-prevention-email',
    cron: '@daily', // Run daily (cronbake will pick a time)
    callback: async () => {
      const processId = process.pid;
      const timestamp = new Date().toISOString();
      console.log(
        `📧 [CHURN PREVENTION] Running churn prevention email job... (PID: ${processId}, Time: ${timestamp})`
      );

      try {
        // Don't send churn emails on weekends - people might just be taking a break
        const now = new Date();
        const isWeekend = now.getDay() === 0 || now.getDay() === 6; // 0 = Sunday, 6 = Saturday

        if (isWeekend) {
          console.log('[CHURN PREVENTION] Skipping churn emails on weekend');
          return;
        }

        const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000);
        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000; // 24 hours ago

        let emailsSent = 0;
        const maxEmailsToSend = 50; // Safety break to avoid infinite loops

        // Atomically find and update users to prevent race conditions
        while (emailsSent < maxEmailsToSend) {
          const userToProcess = await UserModel.findOneAndUpdate(
            {
              lastChurnEmailSent: { $exists: false },
              createdAt: { $lt: fourDaysAgo },
            },
            { $set: { lastChurnEmailSent: new Date() } },
            { new: true }
          );

          if (!userToProcess) {
            console.log('[CHURN PREVENTION] No more users to process.');
            break; // No users left to process
          }

          console.log(
            `[CHURN PREVENTION] Processing user ${userToProcess.email} (lastChurnEmailSent: ${userToProcess.lastChurnEmailSent})`
          );

          // Check if the user has been active in the last 24 hours
          const recentActivity = await ActiveWindowEventModel.findOne({
            userId: userToProcess._id.toString(),
            timestamp: { $gte: oneDayAgo },
          }).lean();

          if (recentActivity) {
            console.log(
              `[CHURN PREVENTION] User ${userToProcess.email} has recent activity, skipping email.`
            );
            continue; // Skip to the next user
          }

          // User hasn't been active, send the email
          try {
            const firstName = userToProcess.name ? userToProcess.name.split(' ')[0] : '';
            console.log(
              `[CHURN PREVENTION] Sending email to ${userToProcess.email} (${firstName}) - no activity in 24h`
            );

            await loops.sendTransactionalEmail({
              transactionalId: 'cmd82afmp0yv4yx0iywbgtg7d',
              email: userToProcess.email,
              dataVariables: {
                datavariable: firstName,
              },
            });

            emailsSent++;
            console.log(`[CHURN PREVENTION] Sent churn prevention email to ${userToProcess.email}`);
          } catch (error) {
            console.error(
              `[CHURN PREVENTION] Error sending email to ${userToProcess.email}:`,
              error
            );
            // Revert the lastChurnEmailSent field if the email fails, so we can retry
            await UserModel.findByIdAndUpdate(userToProcess._id, {
              $unset: { lastChurnEmailSent: '' },
            });
          }
        }

        console.log(
          `[CHURN PREVENTION] Finished processing, sent ${emailsSent} churn prevention emails.`
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
