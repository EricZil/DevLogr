import { prisma } from "../lib/prisma";
import { AppError } from "../lib/error-handler";
import { z } from "zod";

async function verifyMilestoneOwnership(milestoneId: string, userId: string) {
  const milestone = await prisma.milestone.findFirst({
    where: { id: milestoneId, project: { userId } },
  });
  if (!milestone) {
    throw new AppError(
      "Milestone not found or access denied",
      404,
      "MILESTONE_NOT_FOUND"
    );
  }
  return milestone;
}

const createMilestoneSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
});

const updateMilestoneSchema = createMilestoneSchema.partial().extend({
    progress: z.number().int().min(0).max(100).optional(),
});

export async function getMilestonesForProject(
  projectId: string,
  userId: string
) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
  });
  if (!project) {
    throw new AppError(
      "Project not found or access denied",
      404,
      "PROJECT_NOT_FOUND"
    );
  }
  return prisma.milestone.findMany({
    where: { projectId },
    include: {
      tasks: {
        include: {
          subtasks: { orderBy: { order: "asc" } },
          _count: { select: { comments: true, timeEntries: true } },
        },
        orderBy: { order: "asc" },
      },
    },
    orderBy: [
      { completedAt: "asc" },
      { dueDate: "asc" },
      { createdAt: "desc" },
    ],
  });
}


export async function createMilestone(
  projectId: string,
  userId: string,
  milestoneData: any
) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
  });
  if (!project) {
    throw new AppError(
      "Project not found or access denied",
      404,
      "PROJECT_NOT_FOUND"
    );
  }
  const validatedData = createMilestoneSchema.parse(milestoneData);
  return prisma.milestone.create({
    data: {
      projectId,
      ...validatedData,
      dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
    },
  });
}

export async function getMilestone(milestoneId: string, userId: string) {
    return verifyMilestoneOwnership(milestoneId, userId);
}

export async function updateMilestone(
  milestoneId: string,
  userId: string,
  milestoneData: any
) {
  const existingMilestone = await verifyMilestoneOwnership(milestoneId, userId);
  const validatedData = updateMilestoneSchema.parse(milestoneData);

  return prisma.milestone.update({
    where: { id: milestoneId },
    data: {
      ...validatedData,
      ...(validatedData.dueDate !== undefined && { dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null }),
      ...(validatedData.progress !== undefined && {
        completedAt: validatedData.progress >= 100 ? existingMilestone.completedAt || new Date() : null,
      }),
    },
  });
}

export async function completeMilestone(milestoneId: string, userId: string) {
    await verifyMilestoneOwnership(milestoneId, userId);
    return prisma.milestone.update({
        where: { id: milestoneId },
        data: { progress: 100, completedAt: new Date() },
    });
}

export async function reopenMilestone(milestoneId: string, userId: string) {
    const milestone = await verifyMilestoneOwnership(milestoneId, userId);
    return prisma.milestone.update({
        where: { id: milestoneId },
        data: {
            progress: Math.min(99, milestone.progress),
            completedAt: null,
        },
    });
}

export async function deleteMilestone(milestoneId: string, userId: string) {
    await verifyMilestoneOwnership(milestoneId, userId);
    await prisma.milestone.delete({ where: { id: milestoneId } });
    return { message: "Milestone deleted successfully" };
}

export async function getMilestoneStats(projectId: string, userId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
  });
  if (!project) {
    throw new AppError(
      "Project not found or access denied",
      404,
      "PROJECT_NOT_FOUND"
    );
  }

  const stats = await prisma.milestone.aggregate({
    where: { projectId },
    _count: { id: true },
    _avg: { progress: true },
  });

  const completedCount = await prisma.milestone.count({
    where: {
      projectId,
      completedAt: { not: null },
    },
  });

  const overdueCount = await prisma.milestone.count({
    where: {
      projectId,
      dueDate: { lt: new Date() },
      completedAt: null,
    },
  });

  return {
    total: stats._count.id,
    completed: completedCount,
    pending: stats._count.id - completedCount,
    overdue: overdueCount,
    averageProgress: Math.round(stats._avg.progress || 0),
  };
} 