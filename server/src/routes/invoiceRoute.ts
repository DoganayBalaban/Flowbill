import { Router } from "express";
import {
  createInvoice,
  deleteInvoice,
  downloadInvoicePdf,
  generateInvoicePdf,
  getInvoiceById,
  getInvoices,
  getInvoiceStats,
  markInvoiceAsPaid,
  sendInvoiceEmail,
  updateInvoice,
} from "../controllers/invoiceController";
import { protect } from "../middlewares/authMiddleware";
import { invoiceSendLimiter } from "../middlewares/rateLimiter";

const router = Router();

/**
 * @openapi
 * /api/invoices:
 *   get:
 *     tags: [Invoices]
 *     summary: List all invoices
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [draft, sent, paid, overdue, cancelled] }
 *       - in: query
 *         name: sort
 *         schema: { type: string, enum: [created_at, invoice_number, due_date, total_amount, status] }
 *       - in: query
 *         name: order
 *         schema: { type: string, enum: [asc, desc] }
 *     responses:
 *       200:
 *         description: Paginated invoice list
 *   post:
 *     tags: [Invoices]
 *     summary: Create an invoice
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [clientId, issueDate, dueDate]
 *             properties:
 *               clientId: { type: string }
 *               issueDate: { type: string, format: date }
 *               dueDate: { type: string, format: date }
 *               currency: { type: string, default: USD }
 *               taxRate: { type: number }
 *               discount: { type: number }
 *               notes: { type: string }
 *               terms: { type: string }
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     description: { type: string }
 *                     quantity: { type: number }
 *                     unitPrice: { type: number }
 *     responses:
 *       201:
 *         description: Invoice created
 */
router.get("/", protect, getInvoices);
router.post("/", protect, createInvoice);

/**
 * @openapi
 * /api/invoices/stats:
 *   get:
 *     tags: [Invoices]
 *     summary: Get invoice statistics
 *     responses:
 *       200:
 *         description: Invoice stats (totals by status)
 */
router.get("/stats", protect, getInvoiceStats);

/**
 * @openapi
 * /api/invoices/{id}:
 *   get:
 *     tags: [Invoices]
 *     summary: Get an invoice by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Invoice data
 *       404:
 *         description: Invoice not found
 *   patch:
 *     tags: [Invoices]
 *     summary: Update an invoice
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               dueDate: { type: string, format: date }
 *               notes: { type: string }
 *               terms: { type: string }
 *               taxRate: { type: number }
 *               discount: { type: number }
 *     responses:
 *       200:
 *         description: Invoice updated
 *   delete:
 *     tags: [Invoices]
 *     summary: Delete an invoice
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204:
 *         description: Invoice deleted
 */
router.get("/:id", protect, getInvoiceById);
router.patch("/:id", protect, updateInvoice);
router.delete("/:id", protect, deleteInvoice);

/**
 * @openapi
 * /api/invoices/{id}/pdf:
 *   post:
 *     tags: [Invoices]
 *     summary: Queue PDF generation for an invoice
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       202:
 *         description: PDF generation queued
 * /api/invoices/{id}/download:
 *   get:
 *     tags: [Invoices]
 *     summary: Download invoice PDF
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: PDF file
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: PDF not yet generated
 * /api/invoices/{id}/send:
 *   post:
 *     tags: [Invoices]
 *     summary: Send invoice via email
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Email queued
 * /api/invoices/{id}/mark-paid:
 *   post:
 *     tags: [Invoices]
 *     summary: Record a payment for an invoice
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount, paymentDate]
 *             properties:
 *               amount: { type: number }
 *               paymentDate: { type: string, format: date }
 *               method: { type: string }
 *               reference: { type: string }
 *               note: { type: string }
 *     responses:
 *       200:
 *         description: Payment recorded
 */
router.post("/:id/pdf", protect, generateInvoicePdf);
router.get("/:id/download", protect, downloadInvoicePdf);
router.post("/:id/send", protect, invoiceSendLimiter, sendInvoiceEmail);
router.post("/:id/mark-paid", protect, markInvoiceAsPaid);

export default router;
