import { prisma } from "../lib/prisma";
import { AppError } from "../lib/error-handler";
import { z } from "zod";
import { cache, cacheKeys, cacheOrFetch, invalidateCache, TTL } from '../utils/cache';

async function verifyTaskOwnership(taskId: string, userId: string) {
  const task = await prisma.task.findFirst({
    where: { id: taskId, milestone: { project: { userId } } },
  });
  if (!task) {
    throw new AppError(
      "Task not found or access denied",
      404,
      "TASK_NOT_FOUND"
    );
  }
  return task;
}

async function verifySubtaskOwnership(subtaskId: string, userId: string) {
    const subtask = await prisma.subtask.findFirst({
        where: { id: subtaskId, task: { milestone: { project: { userId } } } },
        include: { task: { select: { milestoneId: true } } }
    });
    if (!subtask) {
        throw new AppError("Subtask not found or access denied", 404, "SUBTASK_NOT_FOUND");
    }
    return subtask;
}

export async function updateMilestoneProgress(milestoneId: string) {
  const tasks = await prisma.task.findMany({
    where: {
      milestoneId,
      status: { not: "CANCELLED" }
    },
    select: {
      id: true,
      status: true,
      subtasks: {
        select: { completed: true }
      }
    }
  });

  if (tasks.length === 0) {
    const progress = 0;
    await prisma.milestone.update({
      where: { id: milestoneId },
      data: { progress },
    });
    
    await cache.set(cacheKeys.milestoneProgress(milestoneId), progress, TTL.SHORT);
    console.timeEnd(`updateMilestoneProgress-${milestoneId}`);
    return progress;
  }

  let totalWeight = 0;
  let completedWeight = 0;
  const statusWeights: Record<string, number> = {
    TODO: 0,
    IN_PROGRESS: 0.3,
    IN_REVIEW: 0.8,
    DONE: 1.0,
    CANCELLED: 0,
  };

  for (const task of tasks) {
    const weight = 1;
    totalWeight += weight;
    let taskCompletion = statusWeights[task.status] || 0;
    
    if (task.subtasks.length > 0) {
      const completedSubtasks = task.subtasks.filter(st => st.completed).length;
      const subtaskProgress = completedSubtasks / task.subtasks.length;
      
      switch (task.status) {
        case "TODO":
          taskCompletion = Math.max(taskCompletion, subtaskProgress * 0.4);
          break;
        case "IN_PROGRESS":
          taskCompletion = Math.max(taskCompletion, subtaskProgress * 0.7);
          break;
        case "IN_REVIEW":
          taskCompletion = Math.max(taskCompletion, subtaskProgress * 0.9);
          break;
        case "DONE":
          taskCompletion = 1.0;
          break;
      }
    }
    completedWeight += weight * taskCompletion;
  }

  const progress = totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0;
  await prisma.milestone.update({
    where: { id: milestoneId },
    data: {
      progress,
      completedAt: progress === 100 ? new Date() : null,
    },
  });
  
  await cache.set(cacheKeys.milestoneProgress(milestoneId), progress, TTL.SHORT);
  
  console.timeEnd(`updateMilestoneProgress-${milestoneId}`);
  return progress;
}

export function updateMilestoneProgressAsync(milestoneId: string) {
  setImmediate(async () => {
    try {
      await updateMilestoneProgress(milestoneId);
    } catch (error) {
      console.error(`Failed to update milestone progress for ${milestoneId}:`, error);
    }
  });
}

const taskSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  status: z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "CANCELLED"]).default("TODO"),
  estimatedHours: z.number().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  subtasks: z.array(z.object({
    title: z.string().trim().min(1, "Subtask title is required"),
    completed: z.boolean().default(false)
  })).optional().default([]),
});

const updateTaskSchema = taskSchema.partial().extend({
    actualHours: z.number().optional(),
    startDate: z.string().datetime().optional().nullable(),
});

const subtaskSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
});

const updateSubtaskSchema = subtaskSchema.partial().extend({
    completed: z.boolean().optional(),
});

const timeEntrySchema = z.object({
    hours: z.number().positive("Hours must be a positive number"),
    description: z.string().optional(),
    date: z.string().datetime().optional(),
});

export async function getTasksForMilestone(milestoneId: string, userId: string) {
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
  
  const cacheKey = `milestone:${milestoneId}:tasks:${userId}`;
  return cacheOrFetch(
    cacheKey,
    () => prisma.task.findMany({
      where: { milestoneId },
      include: {
        subtasks: { orderBy: { order: "asc" } },
        _count: { select: { comments: true, timeEntries: true } },
      },
      orderBy: { order: "asc" },
    }),
    TTL.MEDIUM
  );
}

export async function createTask(
  milestoneId: string,
  userId: string,
  taskData: any
) {
  const milestone = await prisma.milestone.findFirst({
    where: { id: milestoneId, project: { userId } },
  });
  if (!milestone) {
    throw new AppError("Milestone not found or access denied", 404, "MILESTONE_NOT_FOUND");
  }

  const validatedData = taskSchema.parse(taskData);
  const maxOrder = await prisma.task.aggregate({
    where: { milestoneId },
    _max: { order: true },
  });

  const { subtasks, ...taskDataWithoutSubtasks } = validatedData;

  const task = await prisma.task.create({
    data: {
      milestoneId,
      ...taskDataWithoutSubtasks,
      status: validatedData.status,
      dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
      order: (maxOrder._max.order || 0) + 1,
    },
    include: {
      subtasks: { orderBy: { order: "asc" } },
      _count: { select: { comments: true, timeEntries: true } },
    },
  });

  if (subtasks && subtasks.length > 0) {
    await prisma.subtask.createMany({
      data: subtasks.map((subtask, index) => ({
        taskId: task.id,
        title: subtask.title,
        completed: subtask.completed,
        order: index + 1,
      })),
    });
  }

  await updateMilestoneProgress(milestoneId);
  
  return prisma.task.findUnique({
    where: { id: task.id },
    include: {
      subtasks: { orderBy: { order: "asc" } },
      _count: { select: { comments: true, timeEntries: true } },
    },
  });
}

export async function getTask(taskId: string, userId: string) {
  const task = await verifyTaskOwnership(taskId, userId);
  return prisma.task.findUnique({
      where: { id: taskId },
      include: {
        subtasks: { orderBy: { order: "asc" } },
        comments: { include: { user: { select: { id: true, name: true, avatar: true } } }, orderBy: { createdAt: 'desc' } },
        timeEntries: { include: { user: { select: { id: true, name: true } } }, orderBy: { date: 'desc' } },
        milestone: { select: { id: true, title: true, project: { select: { id: true, title: true } } } }
      }
  });
}

export async function updateTask(taskId: string, userId: string, taskData: any) {
  console.time(`updateTask-${taskId}`);
  
  const existingTask = await verifyTaskOwnership(taskId, userId);
  const validatedData = updateTaskSchema.parse(taskData);
  
  const updatePayload: any = { ...validatedData };
  if(validatedData.dueDate !== undefined) updatePayload.dueDate = validatedData.dueDate ? new Date(validatedData.dueDate) : null;
  if(validatedData.startDate !== undefined) updatePayload.startDate = validatedData.startDate ? new Date(validatedData.startDate) : null;
  if (validatedData.status && validatedData.status !== existingTask.status) {
    updatePayload.completedAt = validatedData.status === 'DONE' ? new Date() : null;
  }

  const updatedTask = await prisma.task.update({
    where: { id: taskId },
    data: updatePayload,
  });
  
  await invalidateCache.milestone(existingTask.milestoneId);
  updateMilestoneProgressAsync(existingTask.milestoneId);
  
  console.timeEnd(`updateTask-${taskId}`);
  return updatedTask;
}

export async function deleteTask(taskId: string, userId: string) {
    const task = await verifyTaskOwnership(taskId, userId);
    await prisma.task.delete({ where: { id: taskId } });
    await updateMilestoneProgress(task.milestoneId);
    return { message: "Task deleted successfully" };
}

export async function createSubtask(taskId: string, userId: string, subtaskData: any) {
    const task = await verifyTaskOwnership(taskId, userId);
    const validatedData = subtaskSchema.parse(subtaskData);
    const maxOrder = await prisma.subtask.aggregate({
        where: { taskId },
        _max: { order: true },
    });
    const subtask = await prisma.subtask.create({
        data: {
            taskId,
            ...validatedData,
            order: (maxOrder._max.order || 0) + 1,
        }
    });
    await updateMilestoneProgress(task.milestoneId);
    return subtask;
}

export async function updateSubtask(subtaskId: string, userId: string, subtaskData: any) {
    const existingSubtask = await verifySubtaskOwnership(subtaskId, userId);
    const validatedData = updateSubtaskSchema.parse(subtaskData);
    const subtask = await prisma.subtask.update({
        where: { id: subtaskId },
        data: validatedData,
    });
    await updateMilestoneProgress(existingSubtask.task.milestoneId);
    return subtask;
}

export async function deleteSubtask(subtaskId: string, userId: string) {
    const subtask = await verifySubtaskOwnership(subtaskId, userId);
    await prisma.subtask.delete({ where: { id: subtaskId } });
    await updateMilestoneProgress(subtask.task.milestoneId);
    return { message: "Subtask deleted successfully" };
}

export async function createTaskComment(
  taskId: string,
  userId: string,
  content: string
) {
  if (!content || content.trim().length === 0) {
    throw new AppError("Comment content is required", 400, "MISSING_CONTENT");
  }
  await verifyTaskOwnership(taskId, userId);
  return prisma.taskComment.create({
    data: {
      taskId,
      userId,
      content: content.trim(),
    },
    include: {
      user: {
        select: { id: true, name: true, username: true, avatar: true },
      },
    },
  });
}

export async function logTimeForTask(
  taskId: string,
  userId: string,
  timeData: any
) {
  const task = await verifyTaskOwnership(taskId, userId);
  const validatedData = timeEntrySchema.parse(timeData);

  const timeEntry = await prisma.timeEntry.create({
    data: {
      taskId,
      userId,
      hours: validatedData.hours,
      description: validatedData.description || null,
      date: validatedData.date ? new Date(validatedData.date) : new Date(),
    },
  });

  const newActualHours = (task.actualHours || 0) + validatedData.hours;
  await prisma.task.update({
    where: { id: taskId },
    data: { actualHours: newActualHours },
  });

  return timeEntry;
}

export async function getTaskStats(taskId: string, userId: string) {
    const task = await verifyTaskOwnership(taskId, userId);
    const fullTask = await prisma.task.findUnique({
        where: { id: taskId },
        include: { subtasks: true, timeEntries: true, comments: true }
    });

    if (!fullTask) {
        throw new AppError("Task not found", 404, "TASK_NOT_FOUND");
    }

    return {
        subtasks: {
            total: fullTask.subtasks.length,
            completed: fullTask.subtasks.filter((st: any) => st.completed).length,
        },
        timeTracking: {
            estimatedHours: fullTask.estimatedHours || 0,
            actualHours: fullTask.actualHours || 0,
            totalEntries: fullTask.timeEntries.length,
        },
        activity: {
            commentsCount: fullTask.comments.length,
            lastActivity: fullTask.updatedAt,
        }
    };
}

export async function getTasksForProject(projectId: string, userId: string) {
    const project = await prisma.project.findFirst({
        where: { id: projectId, userId },
    });
    if (!project) {
        throw new AppError("Project not found or access denied", 404, "PROJECT_NOT_FOUND");
    }
    return prisma.task.findMany({
        where: { milestone: { projectId } },
        include: {
            subtasks: { orderBy: { order: 'asc' } },
            _count: { select: { comments: true, timeEntries: true } }
        },
        orderBy: [{ status: 'asc' }, { order: 'asc' }]
    });
} 