import { prisma } from "../lib/prisma";
import { AppError } from "../lib/error-handler";
import { z } from "zod";

async function verifyUpdateOwnership(updateId: string, userId: string) {
  const update = await prisma.projectUpdate.findFirst({
    where: { id: updateId, project: { userId } },
  });
  if (!update) {
    throw new AppError(
      "Update not found or access denied",
      404,
      "UPDATE_NOT_FOUND"
    );
  }
  return update;
}

const updateSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  content: z.string().trim().min(1, "Content is required"),
  type: z
    .enum([
      "PROGRESS",
      "MILESTONE",
      "FEATURE",
      "BUGFIX",
      "ANNOUNCEMENT",
      "RELEASE",
    ])
    .default("PROGRESS"),
  images: z.array(z.string().url()).optional(),
});

const partialUpdateSchema = updateSchema.partial();

export async function getUpdatesForProject(projectId: string, userId: string) {
  await prisma.project.findFirstOrThrow({
    where: { id: projectId, userId },
  });
  const updates = await prisma.projectUpdate.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
  });
  return updates.map((u: any) => ({
    ...u,
    images: u.images ? (JSON.parse(u.images) as string[]) : null,
  }));
}

export async function createUpdate(
  projectId: string,
  userId: string,
  updateData: any
) {
  await prisma.project.findFirstOrThrow({
    where: { id: projectId, userId },
  });
  const validatedData = updateSchema.parse(updateData);
  const update = await prisma.projectUpdate.create({
    data: {
      projectId,
      ...validatedData,
      images: validatedData.images
        ? JSON.stringify(validatedData.images)
        : null,
    },
  });
  return { ...update, images: update.images ? JSON.parse(update.images) : null };
}

export async function getRecentUpdates(userId: string, limit: number = 5) {
  const updates = await prisma.projectUpdate.findMany({
    where: { project: { userId } },
    include: { project: { select: { title: true } } },
    orderBy: { createdAt: "desc" },
    take: Math.max(1, Math.min(limit, 20)),
  });
  return updates.map((u: any) => ({
    id: u.id,
    projectId: u.projectId,
    projectTitle: u.project.title,
    title: u.title,
    content: u.content,
    type: u.type,
    createdAt: u.createdAt,
  }));
}

export async function getUpdate(updateId: string, userId: string) {
    const update = await verifyUpdateOwnership(updateId, userId);
    return { ...update, images: update.images ? JSON.parse(update.images) : null };
}

export async function updateAnUpdate(
  updateId: string,
  userId: string,
  updateData: any
) {
  await verifyUpdateOwnership(updateId, userId);
  const validatedData = partialUpdateSchema.parse(updateData);
  const { images, ...restOfData } = validatedData;
  const updatePayload: any = restOfData;

  if (images !== undefined) {
    updatePayload.images = images ? JSON.stringify(images) : null;
  }

  const update = await prisma.projectUpdate.update({
    where: { id: updateId },
    data: updatePayload,
  });
  return { ...update, images: update.images ? JSON.parse(update.images) : null };
}

export async function deleteUpdate(updateId: string, userId: string) {
    await verifyUpdateOwnership(updateId, userId);
    await prisma.projectUpdate.delete({ where: { id: updateId } });
    return { message: "Update deleted successfully" };
}

export async function getUpdateStats(projectId: string, userId: string) {
    await prisma.project.findFirstOrThrow({ where: { id: projectId, userId } });
    const types = await prisma.projectUpdate.groupBy({
        by: ['type'],
        where: { projectId },
        _count: { _all: true },
    });
    const total = types.reduce((sum: number, t: any) => sum + t._count._all, 0);
    const counts: Record<string, number> = {};
    types.forEach((t: any) => {
      counts[t.type] = t._count._all;
    });
    return { total, counts };
} 