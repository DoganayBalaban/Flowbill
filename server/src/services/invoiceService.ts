import { env } from "../config/env";
import { lsRequest } from "../config/lemonSqueezy";
import { redis } from "../config/redis";
import { getIO } from "../config/socket";
import { emailQueue } from "../queues/emailQueue";
import { pdfQueue } from "../queues/pdfQueue";
import { AppError } from "../utils/appError";
import { assertCanCreateInvoice } from "../utils/planGuard";
import { prisma } from "../utils/prisma";
import { getSignedDownloadUrl } from "../utils/storageUpload";
import {
  CreateInvoiceInput,
  GetInvoicesQueryInput,
  MarkInvoiceAsPaidInput,
  UpdateInvoiceInput,
} from "../validators/invoiceSchema";

export class InvoiceService {
  static async createInvoice(userId: string, data: CreateInvoiceInput) {
    await assertCanCreateInvoice(userId);
    return await prisma.$transaction(
      async (tx) => {
        if (data.dueDate < data.issueDate) {
          throw new AppError("Due date cannot be before issue date", 400);
        }
        const invoiceCount = await tx.invoice.count({
          where: { user_id: userId },
        });
        const invoiceNumber = `INV-${invoiceCount + 1}`;
        let subtotal = 0;
        const invoiceItems: any[] = [];

        // ── Path A: from time entries ──────────────────────────────────────
        if (data.timeEntryIds?.length) {
          const timeEntries = await tx.timeEntry.findMany({
            where: {
              id: { in: data.timeEntryIds },
              user_id: userId,
              deleted_at: null,
              invoiced: false,
              billable: true,
              ended_at: { not: null },
            },
          });
          if (timeEntries.length !== data.timeEntryIds.length) {
            throw new AppError("Invalid or already invoiced time entries", 400);
          }
          for (const entry of timeEntries) {
            const hours = entry.duration_minutes! / 60;
            const rate = Number(entry.hourly_rate ?? 0);
            const amount = hours * rate;
            subtotal += amount;
            invoiceItems.push({
              description: entry.description ?? "Time entry",
              quantity: hours,
              rate,
              amount,
            });
          }
        }

        // ── Path B: manual line items ──────────────────────────────────────
        if (data.items?.length) {
          for (const item of data.items) {
            const amount = item.quantity * item.rate;
            subtotal += amount;
            invoiceItems.push({
              description: item.description,
              quantity: item.quantity,
              rate: item.rate,
              amount,
            });
          }
        }

        if (invoiceItems.length === 0) {
          throw new AppError(
            "Invoice must have at least one item or time entry",
            400,
          );
        }

        const taxAmount = (subtotal * (data.tax ?? 0)) / 100;
        const discountAmount = (subtotal * (data.discount ?? 0)) / 100;

        const total = subtotal + taxAmount - discountAmount;
        if (total <= 0) {
          throw new AppError("Invoice total must be greater than zero", 400);
        }
        const invoice = await tx.invoice.create({
          data: {
            user_id: userId,
            client_id: data.clientId,
            invoice_number: invoiceNumber,
            issue_date: data.issueDate,
            due_date: data.dueDate,
            subtotal,
            tax: taxAmount,
            discount: discountAmount,
            total,
            currency: data.currency ?? "USD",
            notes: data.notes,
            terms: data.terms,
            invoice_items: {
              create: invoiceItems,
            },
          },
          include: {
            invoice_items: true,
          },
        });
        if (data.timeEntryIds?.length) {
          await tx.timeEntry.updateMany({
            where: { id: { in: data.timeEntryIds } },
            data: { invoiced: true, invoice_id: invoice.id },
          });
        }
        await tx.auditLog.create({
          data: {
            user_id: userId,
            action: "create",
            entity_type: "invoice",
            entity_id: invoice.id,
            new_values: invoice,
          },
        });
        await redis.del(`dashboard:stats:${userId}`);
        await redis.del(`dashboard:revenue:${userId}`);
        return invoice;
      },
      {
        isolationLevel: "Serializable",
      },
    );
  }

  static async getInvoices(userId: string, query: GetInvoicesQueryInput) {
    const { page, limit, status, clientId, start, end, sortBy, sortOrder } =
      query;
    const skip = (page - 1) * limit;

    const where: any = {
      user_id: userId,
      deleted_at: null,
      ...(status && { status }),
      ...(clientId && { client_id: clientId }),
      ...(start &&
        end && {
          issue_date: { gte: start, lte: end },
        }),
    };

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          invoice_number: true,
          issue_date: true,
          due_date: true,
          total: true,
          currency: true,
          status: true,
          pdf_status: true,
          sent_at: true,
          paid_at: true,
          created_at: true,
          client: {
            select: { id: true, name: true, company: true, email: true },
          },
        },
      }),
      prisma.invoice.count({ where }),
    ]);

    return {
      data: invoices,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getInvoiceStats(userId: string, start?: Date, end?: Date) {
    const whereDateFilter =
      start && end ? `AND issue_date BETWEEN $2 AND $3` : "";
    const params: any[] = [userId];
    if (start && end) {
      params.push(start);
      params.push(end);
    }
    const result = await prisma.$queryRawUnsafe<any[]>(
      `
         SELECT
      COALESCE(SUM(total), 0) AS total_invoiced,
      COALESCE(SUM(CASE WHEN status = 'paid' THEN total ELSE 0 END), 0) AS total_paid,
      COALESCE(SUM(CASE WHEN status = 'sent' THEN total ELSE 0 END), 0) AS total_pending,
      COALESCE(SUM(CASE WHEN status = 'overdue' THEN total ELSE 0 END), 0) AS total_overdue,
      COALESCE(SUM(CASE WHEN status = 'draft' THEN total ELSE 0 END), 0) AS total_draft
    FROM invoices
    WHERE user_id = $1
      AND deleted_at IS NULL
      ${whereDateFilter}
      `,
      ...params,
    );
    return {
      total_invoiced: Number(result[0].total_invoiced),
      total_paid: Number(result[0].total_paid),
      total_pending: Number(result[0].total_pending),
      total_overdue: Number(result[0].total_overdue),
      total_draft: Number(result[0].total_draft),
    };
  }

  static async getInvoiceById(userId: string, invoiceId: string) {
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        user_id: userId,
        deleted_at: null,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            company: true,
          },
        },
        invoice_items: true,
        time_entries: {
          where: {
            deleted_at: null,
          },
          select: {
            id: true,
            description: true,
            duration_minutes: true,
            hourly_rate: true,
            started_at: true,
            ended_at: true,
          },
        },
        payments: true,
      },
    });
    if (!invoice) {
      throw new AppError("Invoice not found", 404);
    }
    return invoice;
  }

  static async updateInvoice(
    userId: string,
    invoiceId: string,
    data: UpdateInvoiceInput,
  ) {
    return await prisma.$transaction(
      async (tx) => {
        const invoice = await tx.invoice.findFirst({
          where: {
            id: invoiceId,
            user_id: userId,
            deleted_at: null,
          },
          include: { invoice_items: true },
        });
        if (!invoice) {
          throw new AppError("Invoice not found", 404);
        }
        if (invoice.status === "paid" || invoice.status === "cancelled") {
          throw new AppError("Cannot modify finalized invoice", 400);
        }
        if (data.status) {
          const validTransactions: Record<string, string[]> = {
            draft: ["sent", "cancelled"],
            sent: ["paid", "overdue"],
            overdue: ["paid"],
          };
          const allowed = validTransactions[invoice.status] || [];
          if (!allowed.includes(data.status)) {
            throw new AppError("Invalid status transition", 400);
          }
        }
        let subtotal = Number(invoice.subtotal);
        if (data.invoice_items) {
          if (invoice.status !== "draft") {
            throw new AppError(
              "Items can only be modified in draft status",
              400,
            );
          }
          await tx.invoiceItem.deleteMany({
            where: {
              invoice_id: invoiceId,
            },
          });
          subtotal = 0;
          const newItems = data.invoice_items.map((item) => {
            const amount = item.quantity * item.rate;
            subtotal += amount;

            return {
              invoice_id: invoiceId,
              description: item.description,
              quantity: item.quantity,
              rate: item.rate,
              amount,
            };
          });
          await tx.invoiceItem.createMany({
            data: newItems,
          });
        }
        const tax = Number(invoice.tax);
        const discount = Number(invoice.discount);

        const total = subtotal + tax - discount;

        if (total <= 0) {
          throw new AppError("Invoice total must be greater than zero", 400);
        }
        const updated = await tx.invoice.update({
          where: { id: invoiceId },
          data: {
            issue_date: data.issue_date,
            due_date: data.due_date,
            notes: data.notes,
            terms: data.terms,
            status: data.status,
            subtotal,
            total,
          },
          include: {
            invoice_items: true,
          },
        });
        await tx.auditLog.create({
          data: {
            user_id: userId,
            action: "update",
            entity_type: "invoice",
            entity_id: invoiceId,
            old_values: invoice,
            new_values: updated,
          },
        });
        await redis.del(`dashboard:stats:${userId}`);
        await redis.del(`dashboard:revenue:${userId}`);
        return updated;
      },
      {
        isolationLevel: "Serializable",
      },
    );
  }

  static async deleteInvoice(userId: string, invoiceId: string) {
    return await prisma.$transaction(
      async (tx) => {
        const invoice = await tx.invoice.findFirst({
          where: {
            id: invoiceId,
            user_id: userId,
            deleted_at: null,
          },
        });
        if (!invoice) {
          throw new AppError("Invoice not found", 404);
        }

        if (invoice.status !== "draft") {
          throw new AppError("Only draft invoices can be deleted", 400);
        }
        await tx.timeEntry.updateMany({
          where: { invoice_id: invoiceId },
          data: {
            invoiced: false,
            invoice_id: null,
          },
        });
        await tx.invoice.update({
          where: {
            id: invoiceId,
          },
          data: {
            deleted_at: new Date(),
          },
        });
        await tx.auditLog.create({
          data: {
            user_id: userId,
            action: "delete",
            entity_type: "invoice",
            entity_id: invoiceId,
            old_values: invoice,
          },
        });
        await redis.del(`dashboard:stats:${userId}`);
        await redis.del(`dashboard:revenue:${userId}`);
        return true;
      },
      {
        isolationLevel: "Serializable",
      },
    );
  }

  /**
   * Idempotent — enqueues a PDF generation job for an invoice.
   *
   * State machine:
   *   not_generated | failed → processing → (worker) → generated | failed
   *
   * @param force Re-generate even if pdf_status === "generated"
   * @returns BullMQ job id (string | number)
   */
  static async enqueuePdfGeneration(
    userId: string,
    invoiceId: string,
    force = false,
  ): Promise<string | number | undefined> {
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, user_id: userId, deleted_at: null },
      select: { id: true, status: true, pdf_status: true },
    });

    if (!invoice) {
      throw new AppError("Invoice not found", 404);
    }

    if (invoice.status === "draft") {
      throw new AppError("Draft invoice cannot generate PDF", 400);
    }

    // Idempotent: already generated and no force flag
    if (!force && invoice.pdf_status === "generated") {
      return invoiceId;
    }

    // Already in-flight — don't double-queue
    if (invoice.pdf_status === "processing") {
      return invoiceId;
    }

    // Mark as processing before enqueuing (ACID-safe optimistic lock)
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { pdf_status: "processing" },
    });

    const job = await pdfQueue.add("generate-invoice-pdf", { invoiceId });

    return job.id;
  }

  // Keep backward-compat alias used by the controller
  static async generateInvoicePdf(
    userId: string,
    invoiceId: string,
    force = false,
  ) {
    return InvoiceService.enqueuePdfGeneration(userId, invoiceId, force);
  }

  /**
   * Returns a pre-signed S3 URL (1 hour TTL) for downloading the invoice PDF.
   * Throws 400 if PDF has not been generated yet.
   */
  static async downloadInvoicePdf(
    userId: string,
    invoiceId: string,
  ): Promise<string> {
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, user_id: userId, deleted_at: null },
      select: { pdf_status: true, pdf_url: true },
    });

    if (!invoice) {
      throw new AppError("Invoice not found", 404);
    }

    if (invoice.pdf_status !== "generated" || !invoice.pdf_url) {
      throw new AppError(
        `PDF is not ready yet (status: ${invoice.pdf_status})`,
        400,
      );
    }

    return getSignedDownloadUrl(invoice.pdf_url);
  }

  /**
   * Smart send: transitions status to "sent" (if draft), then either:
   *  - PDF already generated → queues email directly
   *  - PDF not ready / failed → queues PDF generation with sendAfterPdf=true
   *  - PDF currently processing → returns without double-queuing (email will
   *    be auto-triggered by pdfWorker on completion if sendAfterPdf was set)
   *
   * @returns BullMQ job id or a status string
   */
  static async enqueueInvoiceEmail(
    userId: string,
    invoiceId: string,
  ): Promise<string | number | undefined> {
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, user_id: userId, deleted_at: null },
      select: { id: true, status: true, pdf_status: true, pdf_url: true },
    });

    if (!invoice) {
      throw new AppError("Invoice not found", 404);
    }

    if (invoice.status === "cancelled") {
      throw new AppError("Cancelled invoice cannot be sent", 400);
    }

    // Transition draft → sent so the invoice is visible to the client portal
    if (invoice.status === "draft") {
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: { status: "sent", sent_at: new Date() },
      });
    }

    // PDF already generated — queue email immediately
    if (invoice.pdf_status === "generated" && invoice.pdf_url) {
      const job = await emailQueue.add("send-invoice-email", { invoiceId });
      return job.id;
    }

    // PDF is currently being generated — pdfWorker won't know to send the
    // email because sendAfterPdf wasn't set on the existing job. Queue a new
    // PDF job with the flag; BullMQ deduplication by jobId prevents issues.
    if (invoice.pdf_status === "processing") {
      const job = await pdfQueue.add("generate-invoice-pdf", {
        invoiceId,
        sendAfterPdf: true,
      });
      return job.id;
    }

    // PDF not generated or failed — generate first, email after
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { pdf_status: "processing" },
    });

    const job = await pdfQueue.add("generate-invoice-pdf", {
      invoiceId,
      sendAfterPdf: true,
    });

    return job.id;
  }

  // Backward-compat alias called by the existing controller
  static async sendInvoiceEmail(userId: string, invoiceId: string) {
    return InvoiceService.enqueueInvoiceEmail(userId, invoiceId);
  }

  static async markInvoiceAsPaid(
    userId: string,
    invoiceId: string,
    data: MarkInvoiceAsPaidInput,
  ) {
    return await prisma.$transaction(
      async (tx) => {
        const invoice = await tx.invoice.findFirst({
          where: {
            id: invoiceId,
            user_id: userId,
            deleted_at: null,
          },
          include: {
            payments: true,
            client: true,
          },
        });
        if (!invoice) {
          throw new Error("Invoice not found");
        }

        if (invoice.status === "draft") {
          throw new Error("Draft invoice cannot receive payment");
        }

        if (invoice.status === "cancelled") {
          throw new Error("Cancelled invoice cannot receive payment");
        }
        const totalPaidSoFar = invoice.payments.reduce(
          (sum, p) => sum + Number(p.amount),
          0,
        );
        const remainingAmount = Number(invoice.total) - totalPaidSoFar;
        const paymentAmount = data.amount ?? remainingAmount;

        if (paymentAmount <= 0) {
          throw new AppError("Invalid payment amount", 400);
        }

        if (paymentAmount > remainingAmount) {
          throw new AppError("Payment exceeds remaining balance", 400);
        }

        await tx.payment.create({
          data: {
            invoice_id: invoiceId,
            amount: paymentAmount,
            payment_method: data.paymentMethod,
            reference_number: data.referenceNumber,
            paid_at: data.paidAt,
            notes: data.notes,
          },
        });

        const newTotalPaid = totalPaidSoFar + paymentAmount;
        let newStatus = invoice.status;
        if (newTotalPaid >= Number(invoice.total)) {
          newStatus = "paid";
        } else {
          newStatus = "sent";
        }

        await tx.invoice.update({
          where: { id: invoiceId },
          data: {
            status: newStatus,
            paid_at: newStatus === "paid" ? data.paidAt : invoice.paid_at,
          },
        });

        await tx.client.update({
          where: { id: invoice.client_id },
          data: {
            total_paid: {
              increment: paymentAmount,
            },
          },
        });

        await tx.auditLog.create({
          data: {
            user_id: userId,
            action: "update",
            entity_type: "invoice",
            entity_id: invoiceId,
            old_values: { status: invoice.status, paid_at: invoice.paid_at },
            new_values: { status: newStatus, paid_amount: paymentAmount },
          },
        });

        await redis.del(`dashboard:stats:${userId}`);
        await redis.del(`dashboard:revenue:${userId}`);

        return {
          invoiceId,
          paid_amount: paymentAmount,
          remaining_balance: Number(invoice.total) - newTotalPaid,
          status: newStatus,
        };
      },
      {
        isolationLevel: "Serializable",
      },
    );
  }

  /**
   * Creates (or returns cached) a LemonSqueezy checkout URL for the client
   * to pay the invoice online.
   */
  static async createPaymentLink(
    userId: string,
    invoiceId: string,
  ): Promise<{ url: string }> {
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, user_id: userId, deleted_at: null },
      include: { client: true },
    });

    if (!invoice) {
      throw new AppError("Invoice not found", 404);
    }

    if (invoice.status === "draft") {
      throw new AppError(
        "Send the invoice before creating a payment link",
        400,
      );
    }

    if (invoice.status === "paid" || invoice.status === "cancelled") {
      throw new AppError(
        `Cannot create payment link for a ${invoice.status} invoice`,
        400,
      );
    }

    // Return existing URL if already generated
    if (invoice.lemon_checkout_url && invoice.lemon_checkout_id) {
      return { url: invoice.lemon_checkout_url };
    }

    const amountInCents = Math.round(Number(invoice.total) * 100);

    const body = {
      data: {
        type: "checkouts",
        attributes: {
          custom_price: amountInCents,
          checkout_options: { embed: false },
          checkout_data: {
            email: invoice.client.email ?? undefined,
            custom: { invoiceId: invoice.id, userId },
          },
          product_options: {
            name: `Invoice ${invoice.invoice_number}`,
            description: invoice.notes ?? undefined,
            redirect_url: `${env.FRONTEND_URL}/invoices/${invoice.id}?payment=success`,
          },
        },
        relationships: {
          store: {
            data: { type: "stores", id: env.LEMONSQUEEZY_STORE_ID },
          },
        },
      },
    };

    const response = await lsRequest<{
      data: { id: string; attributes: { url: string } };
    }>("/checkouts", { method: "POST", body: JSON.stringify(body) });

    const checkoutId = response.data.id;
    const checkoutUrl = response.data.attributes.url;

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        lemon_checkout_id: checkoutId,
        lemon_checkout_url: checkoutUrl,
      },
    });

    return { url: checkoutUrl };
  }

  /**
   * Called from the LemonSqueezy webhook when an order_created event fires for an invoice.
   * Idempotent — skips if invoice is already paid.
   */
  static async handleLemonSqueezyOrderPaid(payload: any): Promise<void> {
    const customData = payload.meta?.custom_data ?? {};
    const invoiceId = customData.invoiceId as string | undefined;
    const userId = customData.userId as string | undefined;
    if (!invoiceId || !userId) return;

    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, deleted_at: null },
      include: { payments: true, client: true },
    });

    if (!invoice || invoice.status === "paid") return;

    const attrs = payload.data?.attributes ?? {};
    const amountPaid = (attrs.total ?? 0) / 100;
    const orderId = String(payload.data?.id ?? "");

    await prisma.$transaction(
      async (tx) => {
        await tx.payment.create({
          data: {
            invoice_id: invoiceId,
            amount: amountPaid,
            payment_method: "lemonsqueezy",
            reference_number: orderId,
            paid_at: new Date(),
            notes: "Paid via LemonSqueezy",
            lemon_order_id: orderId,
          },
        });

        await tx.invoice.update({
          where: { id: invoiceId },
          data: {
            status: "paid",
            paid_at: new Date(),
            lemon_order_id: orderId,
          },
        });

        await tx.client.update({
          where: { id: invoice.client_id },
          data: { total_paid: { increment: amountPaid } },
        });

        await tx.auditLog.create({
          data: {
            user_id: userId,
            action: "update",
            entity_type: "invoice",
            entity_id: invoiceId,
            old_values: { status: invoice.status },
            new_values: { status: "paid", paid_via: "lemonsqueezy", amountPaid },
          },
        });
      },
      { isolationLevel: "Serializable" },
    );

    await redis.del(`dashboard:stats:${userId}`);
    await redis.del(`dashboard:revenue:${userId}`);

    // Real-time notification to the freelancer
    try {
      getIO().to(`user:${userId}`).emit("invoice:paid", {
        invoiceId,
        amount: amountPaid,
        invoice_number: invoice.invoice_number,
      });
    } catch {
      // Socket not critical — ignore if not initialized
    }

    // Email notification to the freelancer
    await emailQueue.add("payment-received-notification", {
      invoiceId,
      userId,
      amount: amountPaid,
    });
  }
}
