import { Prisma } from "@prisma/client";
import { AppError } from "../utils/appError";
import { prisma } from "../utils/prisma";

export class ClientService {
  static async getAllClients(
    userId: string,
    query: {
      page: number;
      limit: number;
      search?: string;
      sort: string;
      order: "asc" | "desc";
    },
  ) {
    const { page, limit, search, sort, order } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ClientWhereInput = {
      user_id: userId,
      deleted_at: null,
      ...(search && {
        OR: [
          {
            name: { contains: search, mode: "insensitive" as Prisma.QueryMode },
          },
          {
            company: {
              contains: search,
              mode: "insensitive" as Prisma.QueryMode,
            },
          },
          {
            email: {
              contains: search,
              mode: "insensitive" as Prisma.QueryMode,
            },
          },
        ],
      }),
    };

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        orderBy: { [sort]: order },
        skip,
        take: limit,
      }),
      prisma.client.count({ where }),
    ]);

    return {
      clients,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async getClientById(id: string, userId: string) {
    const client = await prisma.client.findUnique({
      where: {
        id: id,
        user_id: userId,
        deleted_at: null,
      },
    });
    if (!client) {
      throw new AppError("Client not found", 404);
    }
    return client;
  }

  static async createClient(
    userId: string,
    data: {
      name: string;
      company?: string;
      email?: string;
      phone?: string;
      address?: string;
      notes?: string;
      hourly_rate?: number;
    },
  ) {
    const client = await prisma.client.create({
      data: {
        user_id: userId,
        name: data.name,
        company: data.company,
        email: data.email,
        phone: data.phone,
        address: data.address,
        notes: data.notes,
        hourly_rate: data.hourly_rate,
      },
    });
    return client;
  }

  static async updateClient(
    id: string,
    userId: string,
    data: {
      name?: string;
      company?: string;
      email?: string;
      phone?: string;
      address?: string;
      notes?: string;
      hourly_rate?: number;
    },
  ) {
    const existingClient = await prisma.client.findUnique({
      where: {
        id: id,
        user_id: userId,
        deleted_at: null,
      },
    });
    if (!existingClient) {
      throw new AppError("Client not found", 404);
    }
    const client = await prisma.client.update({
      where: {
        id: id,
        user_id: userId,
        deleted_at: null,
      },
      data: {
        name: data.name,
        company: data.company,
        email: data.email,
        phone: data.phone,
        address: data.address,
        notes: data.notes,
        hourly_rate: data.hourly_rate,
      },
    });
    return client;
  }

  static async deleteClient(id: string, userId: string) {
    const existingClient = await prisma.client.findUnique({
      where: {
        id: id,
        user_id: userId,
        deleted_at: null,
      },
    });
    if (!existingClient) {
      throw new AppError("Client not found", 404);
    }
    const client = await prisma.client.update({
      where: {
        id: id,
        user_id: userId,
        deleted_at: null,
      },
      data: {
        deleted_at: new Date(),
      },
    });
    return client;
  }

  static async getClientProjects(clientId: string, userId: string) {
    // Verify client belongs to user
    const client = await prisma.client.findUnique({
      where: {
        id: clientId,
        user_id: userId,
        deleted_at: null,
      },
    });
    if (!client) {
      throw new AppError("Client not found", 404);
    }

    const projects = await prisma.project.findMany({
      where: {
        client_id: clientId,
        user_id: userId,
        deleted_at: null,
      },
      orderBy: { created_at: "desc" },
    });

    return projects;
  }

  static async getClientInvoices(clientId: string, userId: string) {
    // Verify client belongs to user
    const client = await prisma.client.findUnique({
      where: {
        id: clientId,
        user_id: userId,
        deleted_at: null,
      },
    });
    if (!client) {
      throw new AppError("Client not found", 404);
    }

    const invoices = await prisma.invoice.findMany({
      where: {
        client_id: clientId,
        user_id: userId,
        deleted_at: null,
      },
      select: {
        id: true,
        invoice_number: true,
        issue_date: true,
        due_date: true,
        subtotal: true,
        tax: true,
        discount: true,
        total: true,
        currency: true,
        status: true,
        paid_at: true,
        created_at: true,
      },
      orderBy: { issue_date: "desc" },
    });

    return invoices;
  }

  static async getClientRevenue(clientId: string, userId: string) {
    // Verify client belongs to user
    const client = await prisma.client.findUnique({
      where: {
        id: clientId,
        user_id: userId,
        deleted_at: null,
      },
    });
    if (!client) {
      throw new AppError("Client not found", 404);
    }

    // Get total revenue from non-cancelled invoices
    const revenueAgg = await prisma.invoice.aggregate({
      where: {
        client_id: clientId,
        user_id: userId,
        deleted_at: null,
        status: { not: "cancelled" },
      },
      _sum: { total: true },
      _count: { id: true },
    });

    // Get paid invoice count and total
    const paidAgg = await prisma.invoice.aggregate({
      where: {
        client_id: clientId,
        user_id: userId,
        deleted_at: null,
        status: "paid",
      },
      _sum: { total: true },
      _count: { id: true },
    });

    // Get total payments received
    const paymentsAgg = await prisma.payment.aggregate({
      where: {
        invoice: {
          client_id: clientId,
          user_id: userId,
          deleted_at: null,
        },
      },
      _sum: { amount: true },
    });

    const totalRevenue = revenueAgg._sum.total?.toNumber() ?? 0;
    const totalPaid = paymentsAgg._sum.amount?.toNumber() ?? 0;

    return {
      total_revenue: totalRevenue,
      total_paid: totalPaid,
      outstanding: totalRevenue - totalPaid,
      invoice_count: revenueAgg._count.id,
      paid_invoice_count: paidAgg._count.id,
    };
  }

  static async getClientStats(clientId: string, userId: string) {
    const client = await prisma.client.findUnique({
      where: { id: clientId, user_id: userId, deleted_at: null },
    });
    if (!client) throw new AppError("Client not found", 404);

    const [invoiceAgg, paidAgg, timeAgg, projectCount, openInvoiceCount] =
      await Promise.all([
        prisma.invoice.aggregate({
          where: {
            client_id: clientId,
            user_id: userId,
            deleted_at: null,
            status: { not: "cancelled" },
          },
          _sum: { total: true },
          _count: { id: true },
        }),
        prisma.invoice.aggregate({
          where: {
            client_id: clientId,
            user_id: userId,
            deleted_at: null,
            status: "paid",
          },
          _sum: { total: true },
          _count: { id: true },
        }),
        prisma.timeEntry.aggregate({
          where: {
            project: { client_id: clientId },
            user_id: userId,
            deleted_at: null,
          },
          _sum: { duration_minutes: true },
          _count: { id: true },
        }),
        prisma.project.count({
          where: { client_id: clientId, user_id: userId, deleted_at: null },
        }),
        prisma.invoice.count({
          where: {
            client_id: clientId,
            user_id: userId,
            deleted_at: null,
            status: { in: ["sent", "overdue"] },
          },
        }),
      ]);

    const totalRevenue = invoiceAgg._sum.total?.toNumber() ?? 0;
    const totalPaid = paidAgg._sum.total?.toNumber() ?? 0;

    return {
      total_revenue: totalRevenue,
      total_paid: totalPaid,
      outstanding: totalRevenue - totalPaid,
      total_invoice_count: invoiceAgg._count.id,
      paid_invoice_count: paidAgg._count.id,
      open_invoice_count: openInvoiceCount,
      project_count: projectCount,
      total_tracked_hours: ((timeAgg._sum.duration_minutes ?? 0) / 60).toFixed(
        2,
      ),
      time_entry_count: timeAgg._count.id,
    };
  }

  static async getClientTimeEntries(
    clientId: string,
    userId: string,
    query: { page: number; limit: number },
  ) {
    const client = await prisma.client.findUnique({
      where: { id: clientId, user_id: userId, deleted_at: null },
    });
    if (!client) throw new AppError("Client not found", 404);

    const skip = (query.page - 1) * query.limit;
    const where: Prisma.TimeEntryWhereInput = {
      user_id: userId,
      deleted_at: null,
      project: { client_id: clientId },
    };

    const [entries, total] = await Promise.all([
      prisma.timeEntry.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: { started_at: "desc" },
        select: {
          id: true,
          description: true,
          started_at: true,
          ended_at: true,
          duration_minutes: true,
          billable: true,
          invoiced: true,
          hourly_rate: true,
          project: { select: { id: true, name: true } },
        },
      }),
      prisma.timeEntry.count({ where }),
    ]);

    return {
      data: entries,
      meta: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }
}
