import dotenv from 'dotenv';
dotenv.config();

import { LoopsClient } from 'loops';
import mongoose from 'mongoose';
import { ActiveWindowEventModel } from '../models/activeWindowEvent';
import { UserModel } from '../models/user';

const loops = new LoopsClient(process.env.LOOPS_API_KEY!);

console.log('in churn prevention script MONGODB_URI', process.env.MONGODB_URI);

async function run() {
  await mongoose.connect(process.env.MONGODB_URI!);

  const processId = process.pid;
  const timestamp = new Date().toISOString();
  console.log(
    `📧 [CHURN PREVENTION] Running churn prevention email script... (PID: ${processId}, Time: ${timestamp})`
  );

  try {
    const now = new Date();
    const isWeekend = now.getDay() === 0 || now.getDay() === 6;

    if (isWeekend) {
      console.log('[CHURN PREVENTION] Skipping churn emails on weekend');
      return;
    }

    const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000);
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

    let emailsSent = 0;
    const maxEmailsToSend = 50;

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
        break;
      }

      console.log(
        `[CHURN PREVENTION] Processing user ${userToProcess.email} (lastChurnEmailSent: ${userToProcess.lastChurnEmailSent})`
      );

      const recentActivity = await ActiveWindowEventModel.findOne({
        userId: userToProcess._id.toString(),
        timestamp: { $gte: oneDayAgo },
      }).lean();

      if (recentActivity) {
        console.log(
          `[CHURN PREVENTION] User ${userToProcess.email} has recent activity, skipping email.`
        );
        continue;
      }

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
        console.error(`[CHURN PREVENTION] Error sending email to ${userToProcess.email}:`, error);
        await UserModel.findByIdAndUpdate(userToProcess.id, {
          $unset: { lastChurnEmailSent: '' },
        });
      }
    }

    console.log(
      `[CHURN PREVENTION] Finished processing, sent ${emailsSent} churn prevention emails.`
    );
  } catch (error) {
    console.error('[CHURN PREVENTION] Error in churn prevention job:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ [CHURN PREVENTION] Churn prevention email script finished.');
  }
}

run().catch((error) => {
  console.error('Unhandled error in churn prevention script:', error);
  process.exit(1);
});
