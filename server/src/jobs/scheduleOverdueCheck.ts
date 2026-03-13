import { overdueQueue } from "../queues/overdueQueue";
import logger from "../utils/logger";

/**
 * Registers the daily overdue invoice check as a BullMQ repeatable job.
 * Runs at 00:05 UTC every day.
 *
 * Safe to call on every server start — existing schedules are cleared first
 * so stale cron patterns from previous deploys don't accumulate in Redis.
 */
export async function scheduleOverdueCheck(): Promise<void> {
  const existing = await overdueQueue.getRepeatableJobs();
  for (const job of existing) {
    await overdueQueue.removeRepeatableByKey(job.key);
  }

  await overdueQueue.add(
    "overdue-invoice-check",
    {},
    {
      repeat: {
        pattern: "5 0 * * *",
        tz: "UTC",
      },
    },
  );

  logger.info(
    "[scheduleOverdueCheck] Repeatable overdue-invoice-check job registered (00:05 UTC daily)",
  );
}
