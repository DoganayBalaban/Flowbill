import { NextFunction, Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import { InvoiceService } from "../services/invoiceService";
import { catchAsync } from "../utils/catchAsync";
import {
  createInvoiceSchema,
  getInvoicesQuerySchema,
  getInvoiceStatsQuerySchema,
  markInvoiceAsPaidSchema,
  updateInvoiceSchema,
} from "../validators/invoiceSchema";

export const createInvoice = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const parsed = createInvoiceSchema.parse(req.body);
    const invoice = await InvoiceService.createInvoice(userId, parsed);
    return res.status(201).json({
      success: true,
      data: invoice,
    });
  },
);

export const getInvoices = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const query = getInvoicesQuerySchema.parse(req.query);
    const result = await InvoiceService.getInvoices(userId, query);
    return res.status(200).json({
      success: true,
      ...result,
    });
  },
);

export const getInvoiceStats = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const { start, end } = getInvoiceStatsQuerySchema.parse(req.query);
    const stats = await InvoiceService.getInvoiceStats(userId, start, end);
    return res.status(200).json({
      success: true,
      data: stats,
    });
  },
);

export const getInvoiceById = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const invoiceId = req.params.id;
    const invoice = await InvoiceService.getInvoiceById(
      userId,
      invoiceId as string,
    );
    return res.status(200).json({
      success: true,
      data: invoice,
    });
  },
);

export const updateInvoice = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const invoiceId = req.params.id;
    const parsed = updateInvoiceSchema.parse(req.body);
    const updated = await InvoiceService.updateInvoice(
      userId,
      invoiceId as string,
      parsed,
    );
    res.status(200).json({
      success: true,
      data: updated,
    });
  },
);

export const deleteInvoice = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const invoiceId = req.params.id;
    await InvoiceService.deleteInvoice(userId, invoiceId as string);
    return res.status(200).json({
      success: true,
      message: "Invoice deleted successfully",
    });
  },
);

export const generateInvoicePdf = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const invoiceId = req.params.id;
    const force = req.query.force === "true";

    const jobId = await InvoiceService.generateInvoicePdf(
      userId,
      invoiceId as string,
      force,
    );

    return res.status(202).json({
      success: true,
      message: "PDF generation started",
      jobId,
    });
  },
);

export const downloadInvoicePdf = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const invoiceId = req.params.id;

    const signedUrl = await InvoiceService.downloadInvoicePdf(
      userId,
      invoiceId as string,
    );

    return res.status(200).json({
      success: true,
      download_url: signedUrl,
    });
  },
);

export const sendInvoiceEmail = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const invoiceId = req.params.id;

    const jobId = await InvoiceService.sendInvoiceEmail(
      userId,
      invoiceId as string,
    );

    return res.status(202).json({
      success: true,
      message: "Email sending started",
      jobId,
    });
  },
);

export const markInvoiceAsPaid = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const invoiceId = req.params.id;
    const parsed = markInvoiceAsPaidSchema.parse(req.body);
    const result = await InvoiceService.markInvoiceAsPaid(
      userId,
      invoiceId as string,
      parsed,
    );

    return res.status(200).json({
      success: true,
      data: result,
    });
  },
);

export const createPaymentLink = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const invoiceId = req.params.id as string;
    const result = await InvoiceService.createPaymentLink(
      userId,
      invoiceId,
    );

    return res.status(200).json({
      success: true,
      data: result,
    });
  },
);
