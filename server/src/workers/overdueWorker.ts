import { Job, Worker } from "bullmq";
import { redis } from "../config/redis";
import { emailQueue } from "../queues/emailQueue";
import { bullMqConnection } from "../queues/pdfQueue";
import logger from "../utils/logger";
import { prisma } from "../utils/prisma";

const processOverdueCheck = async (_job: Job) => {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  logger.info(`[overdueWorker] Starting overdue check. Cutoff: ${today.toISOString()}`);

  // ── 1. Fetch candidates before bulk update (needed for email content) ──
  const candidates = await prisma.invoice.findMany({
    where: {
      status: "sent",
      due_date: { lt: today },
      deleted_at: null,
    },
    select: {
      id: true,
      invoice_number: true,
      user_id: true,
      due_date: true,
      total: true,
      currency: true,
      client: { select: { name: true } },
    },
  });

  if (candidates.length === 0) {
    logger.info("[overdueWorker] No invoices to transition.");
    return;
  }

  const invoiceIds = candidates.map((inv) => inv.id);

  // ── 2. Bulk status transition ──
  const { count } = await prisma.invoice.updateMany({
    where: { id: { in: invoiceIds } },
    data: { status: "overdue" },
  });

  logger.info(`[overdueWorker] Transitioned ${count} invoice(s) to "overdue"`);

  // ── 3. Summary audit log (system action) ──
  await prisma.auditLog.create({
    data: {
      user_id: null,
      action: "bulk_overdue_transition",
      entity_type: "invoice",
      entity_id: "system",
      new_values: {
        transitioned_ids: invoiceIds,
        count,
        run_at: new Date().toISOString(),
      },
    },
  });

  // ── 4. Invalidate dashboard caches for affected users ──
  const affectedUserIds = [...new Set(candidates.map((inv) => inv.user_id))];
  await Promise.all(
    affectedUserIds.flatMap((uid) => [
      redis.del(`dashboard:stats:${uid}`),
      redis.del(`dashboard:revenue:${uid}`),
    ]),
  );

  // ── 5. Queue one grouped reminder email per user ──
  await Promise.all(
    affectedUserIds.map((userId) => {
      const userInvoices = candidates
        .filter((inv) => inv.user_id === userId)
        .map((inv) => ({
          id: inv.id,
          invoice_number: inv.invoice_number,
          client_name: inv.client.name,
          due_date: inv.due_date,
          total: Number(inv.total),
          currency: inv.currency,
        }));

      return emailQueue.add("overdue-invoice-reminder", {
        userId,
        invoices: userInvoices,
      });
    }),
  );

  logger.info(
    `[overdueWorker] Queued reminder emails for ${affectedUserIds.length} user(s)`,
  );
};

const overdueWorker = new Worker("overdueQueue", processOverdueCheck, {
  connection: bullMqConnection,
  concurrency: 1,
});

overdueWorker.on("completed", (job) => {
  logger.info(`[overdueWorker] Job ${job.id} completed`);
});

overdueWorker.on("failed", (job, err) => {
  logger.error(`[overdueWorker] Job ${job?.id} failed: ${err.message}`);
});

export default overdueWorker;
