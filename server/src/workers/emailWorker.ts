import { Job, Worker } from "bullmq";
import { bullMqConnection } from "../queues/pdfQueue";
import { sendEmail } from "../utils/email";
import { buildInvoiceEmailTemplate } from "../utils/emailTemplates";
import logger from "../utils/logger";
import { prisma } from "../utils/prisma";
import { getSignedDownloadUrl } from "../utils/storageUpload";

interface EmailJobData {
  invoiceId?: string;
  userId?: string;
  amount?: number;
}

const processPaymentReceivedNotification = async (job: Job<EmailJobData>) => {
  const { invoiceId, userId, amount } = job.data;
  if (!invoiceId || !userId) return;

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { client: { select: { name: true } } },
  });
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, first_name: true },
  });

  if (!invoice || !user?.email) return;

  await sendEmail({
    to: user.email,
    subject: `Payment received for Invoice #${invoice.invoice_number}`,
    html: `
      <p>Hi ${user.first_name ?? "there"},</p>
      <p>Great news! Your client <strong>${invoice.client.name}</strong> has paid
      Invoice <strong>#${invoice.invoice_number}</strong>.</p>
      <p><strong>Amount received:</strong> ${amount ?? Number(invoice.total)} ${invoice.currency}</p>
      <p>The invoice has been automatically marked as paid.</p>
    `,
  });

  logger.info(`[emailWorker] Payment notification sent to ${user.email}`);
};

const processSubscriptionPaymentFailed = async (job: Job<EmailJobData>) => {
  const { userId } = job.data;
  if (!userId) return;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, first_name: true },
  });

  if (!user?.email) return;

  await sendEmail({
    to: user.email,
    subject: "Action required: Your Timelyne subscription payment failed",
    html: `
      <p>Hi ${user.first_name ?? "there"},</p>
      <p>We were unable to process your subscription payment.</p>
      <p>Please update your payment method to avoid losing access to your account.</p>
      <p><a href="${process.env.FRONTEND_URL}/settings/billing">Update payment method</a></p>
    `,
  });

  logger.info(`[emailWorker] Payment failed notification sent to ${user.email}`);
};

const processEmailJob = async (job: Job<EmailJobData>) => {
  if (job.name === "payment-received-notification") {
    return processPaymentReceivedNotification(job);
  }
  if (job.name === "subscription-payment-failed") {
    return processSubscriptionPaymentFailed(job);
  }

  const { invoiceId } = job.data;

  logger.info(
    `[emailWorker] Processing email job ${job.id} for invoice ${invoiceId}`,
  );

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      client: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  if (!invoice) {
    throw new Error(`Invoice ${invoiceId} not found`);
  }

  if (!invoice.pdf_url) {
    throw new Error(`Invoice ${invoiceId} has no PDF — cannot send email`);
  }

  // Validate client has an email address
  if (!invoice.client.email) {
    throw new Error(
      `Client has no email address — cannot send invoice ${invoice.invoice_number}`,
    );
  }

  // Generate a 10-minute signed download URL (short expiry per security spec)
  const downloadUrl = await getSignedDownloadUrl(invoice.pdf_url, 600);

  const html = buildInvoiceEmailTemplate({
    invoiceNumber: invoice.invoice_number,
    clientName: invoice.client.name,
    issueDate: invoice.issue_date,
    dueDate: invoice.due_date,
    subtotal: Number(invoice.subtotal),
    tax: Number(invoice.tax),
    discount: Number(invoice.discount),
    total: Number(invoice.total),
    currency: invoice.currency,
    downloadUrl,
    notes: invoice.notes,
  });

  await sendEmail({
    to: invoice.client.email,
    subject: `Invoice #${invoice.invoice_number} from Timelyne`,
    html,
  });

  // Transition status: only advance draft→sent is prevented upstream.
  // sent / overdue / paid stay as-is after a resend.
  const newStatus = invoice.status === "draft" ? "sent" : invoice.status;

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      status: newStatus,
      sent_at: invoice.sent_at ?? new Date(), // only set on first send
    },
  });

  logger.info(
    `[emailWorker] Invoice ${invoice.invoice_number} emailed to ${invoice.client.email}`,
  );
};

// ─── Worker Registration ───────────────────────────────────────────────────

const emailWorker = new Worker<EmailJobData>("emailQueue", processEmailJob, {
  connection: bullMqConnection,
  concurrency: 10,
});

emailWorker.on("completed", (job) => {
  logger.info(`[emailWorker] Job ${job.id} completed`);
});

emailWorker.on("failed", (job, err) => {
  logger.error(`[emailWorker] Job ${job?.id} failed: ${err.message}`);
});

export default emailWorker;
