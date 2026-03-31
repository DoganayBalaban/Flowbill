import { Prisma } from "@prisma/client";
import { AppError } from "../utils/appError";
import { assertCanCreateProject } from "../utils/planGuard";
import { prisma } from "../utils/prisma";
import {
  AddAttachmentInput,
  GetProjectsQueryInput,
} from "../validators/projectSchema";

export class ProjectService {
  static async getAllProjects(userId: string, query: GetProjectsQueryInput) {
    const { page, limit, search, status, client_id, sort, order } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ProjectWhereInput = {
      user_id: userId,
      deleted_at: null,
      ...(status && { status }),
      ...(client_id && { client_id }),
      ...(search && {
        OR: [
          {
            name: { contains: search, mode: "insensitive" as Prisma.QueryMode },
          },
          {
            description: {
              contains: search,
              mode: "insensitive" as Prisma.QueryMode,
            },
          },
        ],
      }),
    };

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        orderBy: { [sort]: order },
        skip,
        take: limit,
        include: {
          client: {
            select: { id: true, name: true, company: true },
          },
        },
      }),
      prisma.project.count({ where }),
    ]);

    return {
      projects,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async createProject(
    userId: string,
    data: {
      name: string;
      status: string;
      client_id?: string;
      description?: string;
      budget?: number;
      hourly_rate?: number;
      start_date?: string;
      deadline?: string;
      color?: string;
    },
  ) {
    await assertCanCreateProject(userId);
    return await prisma.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: {
          user_id: userId,
          name: data.name,
          status: data.status,
          client_id: data.client_id,
          description: data.description,
          budget: data.budget,
          hourly_rate: data.hourly_rate,
          start_date: data.start_date ? new Date(data.start_date) : undefined,
          deadline: data.deadline ? new Date(data.deadline) : undefined,
          color: data.color,
        },
      });
      await tx.auditLog.create({
        data: {
          user_id: userId,
          action: "create",
          entity_type: "project",
          entity_id: project.id,
          new_values: project,
        },
      });
      return project;
    });
  }

  static async addAttachment(data: AddAttachmentInput) {
    const project = await prisma.project.findUnique({
      where: { id: data.projectId },
    });

    if (!project) {
      throw new AppError("Project not found", 404);
    }

    const attachment = await prisma.attachment.create({
      data: {
        user: { connect: { id: data.userId } },
        project: { connect: { id: data.projectId } },
        filename: data.filename,
        file_url: data.file_url,
        file_size: data.file_size,
        mime_type: data.mime_type,
      },
    });

    return attachment;
  }

  static async getProjectAttachments(userId: string, projectId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId, user_id: userId, deleted_at: null },
    });

    if (!project) {
      throw new AppError("Project not found", 404);
    }

    return prisma.attachment.findMany({
      where: { project_id: projectId },
      orderBy: { uploaded_at: "desc" },
    });
  }

  static async deleteAttachment(userId: string, projectId: string, attachmentId: string) {
    const attachment = await prisma.attachment.findFirst({
      where: { id: attachmentId, project_id: projectId, user_id: userId },
    });

    if (!attachment) {
      throw new AppError("Attachment not found", 404);
    }

    await prisma.attachment.delete({ where: { id: attachmentId } });
    return attachment;
  }

  static async getProjectById(userId: string, projectId: string) {
    const project = await prisma.project.findUnique({
      where: {
        user_id: userId,
        id: projectId,
        deleted_at: null,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            company: true,
          },
        },
      },
    });

    if (!project) {
      throw new AppError("Project not found", 404);
    }

    return project;
  }

  static async getProjectTasks(userId: string, projectId: string) {
    const project = await prisma.project.findUnique({
      where: {
        id: projectId,
        user_id: userId,
        deleted_at: null,
      },
    });

    if (!project) {
      throw new AppError("Project not found", 404);
    }

    const tasks = await prisma.task.findMany({
      where: {
        project_id: projectId,
        deleted_at: null,
      },
      orderBy: [{ position: "asc" }, { created_at: "desc" }],
    });

    return tasks;
  }

  static async getProjectTimeEntries(userId: string, projectId: string) {
    const project = await prisma.project.findUnique({
      where: {
        id: projectId,
        user_id: userId,
        deleted_at: null,
      },
    });

    if (!project) {
      throw new AppError("Project not found", 404);
    }

    const timeEntries = await prisma.timeEntry.findMany({
      where: {
        project_id: projectId,
        user_id: userId,
        deleted_at: null,
      },
      include: {
        task: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { started_at: "desc" },
    });

    return timeEntries;
  }

  static async getProjectStats(userId: string, projectId: string) {
    const project = await prisma.project.findUnique({
      where: {
        id: projectId,
        user_id: userId,
        deleted_at: null,
      },
    });

    if (!project) {
      throw new AppError("Project not found", 404);
    }

    const [taskCounts, timeAgg, billableTimeAgg, expenseAgg] =
      await Promise.all([
        // Task counts by status
        prisma.task.groupBy({
          by: ["status"],
          where: { project_id: projectId, deleted_at: null },
          _count: { id: true },
        }),
        // Total tracked time
        prisma.timeEntry.aggregate({
          where: { project_id: projectId, user_id: userId, deleted_at: null },
          _sum: { duration_minutes: true },
          _count: { id: true },
        }),
        // Billable tracked time
        prisma.timeEntry.aggregate({
          where: {
            project_id: projectId,
            user_id: userId,
            deleted_at: null,
            billable: true,
          },
          _sum: { duration_minutes: true },
        }),
        // Total expenses
        prisma.expense.aggregate({
          where: { project_id: projectId, user_id: userId, deleted_at: null },
          _sum: { amount: true },
          _count: { id: true },
        }),
      ]);

    const totalTasks = taskCounts.reduce((sum, g) => sum + g._count.id, 0);
    const tasksByStatus = Object.fromEntries(
      taskCounts.map((g) => [g.status, g._count.id]),
    );

    const totalMinutes = timeAgg._sum.duration_minutes ?? 0;
    const totalHours = Math.round((totalMinutes / 60) * 100) / 100;
    const billableMinutes = billableTimeAgg._sum.duration_minutes ?? 0;
    const billableHours = Math.round((billableMinutes / 60) * 100) / 100;
    const totalExpenses = expenseAgg._sum.amount?.toNumber() ?? 0;

    const budgetUsed = project.budget
      ? Math.round(
          (project.total_billed.toNumber() / project.budget.toNumber()) * 10000,
        ) / 100
      : null;

    return {
      tasks: {
        total: totalTasks,
        ...tasksByStatus,
      },
      time: {
        total_entries: timeAgg._count.id,
        total_hours: totalHours,
        billable_hours: billableHours,
      },
      expenses: {
        total_count: expenseAgg._count.id,
        total_amount: totalExpenses,
      },
      budget: {
        budget: project.budget?.toNumber() ?? null,
        total_billed: project.total_billed.toNumber(),
        budget_used_percent: budgetUsed,
      },
    };
  }

  static async updateProject(
    userId: string,
    projectId: string,
    data: {
      name?: string;
      status?: string;
      client_id?: string;
      description?: string;
      budget?: number;
      hourly_rate?: number;
      start_date?: string;
      deadline?: string;
      color?: string;
    },
  ) {
    const existingProject = await prisma.project.findUnique({
      where: {
        id: projectId,
        user_id: userId,
        deleted_at: null,
      },
    });

    if (!existingProject) {
      throw new AppError("Project not found", 404);
    }

    return await prisma.$transaction(async (tx) => {
      const project = await tx.project.update({
        where: {
          id: projectId,
          user_id: userId,
          deleted_at: null,
        },
        data: {
          name: data.name,
          status: data.status,
          client_id: data.client_id,
          description: data.description,
          budget: data.budget,
          hourly_rate: data.hourly_rate,
          start_date: data.start_date ? new Date(data.start_date) : undefined,
          deadline: data.deadline ? new Date(data.deadline) : undefined,
          color: data.color,
        },
      });
      await tx.auditLog.create({
        data: {
          user_id: userId,
          action: "update",
          entity_type: "project",
          entity_id: project.id,
          old_values: existingProject,
          new_values: project,
        },
      });
      return project;
    });
  }

  static async deleteProject(userId: string, projectId: string) {
    const existingProject = await prisma.project.findUnique({
      where: {
        id: projectId,
        user_id: userId,
        deleted_at: null,
      },
    });

    if (!existingProject) {
      throw new AppError("Project not found", 404);
    }

    return await prisma.$transaction(async (tx) => {
      const project = await tx.project.update({
        where: {
          id: projectId,
          user_id: userId,
          deleted_at: null,
        },
        data: {
          deleted_at: new Date(),
        },
      });
      await tx.auditLog.create({
        data: {
          user_id: userId,
          action: "delete",
          entity_type: "project",
          entity_id: project.id,
          old_values: existingProject,
        },
      });
      return project;
    });
  }
}
