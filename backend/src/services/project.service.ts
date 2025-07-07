import { prisma } from "../lib/prisma";
import { AppError } from "../lib/error-handler";
import { z } from "zod";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
}

async function isSlugAvailable(
  slug: string,
  excludeProjectId?: string
): Promise<boolean> {
  const existing = await prisma.project.findFirst({
    where: {
      slug,
      ...(excludeProjectId && { id: { not: excludeProjectId } }),
    },
  });
  return !existing;
}

async function verifyProjectOwnership(projectId: string, userId: string) {
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
  return project;
}

const createProjectSchema = z.object({
  name: z.string().trim().min(1, "Project name is required"),
  description: z.string().optional(),
  visibility: z.enum(["PUBLIC", "PRIVATE", "UNLISTED"]).default("PUBLIC"),
  allowIssues: z.boolean().default(true),
  allowFeedback: z.boolean().default(true),
  tags: z.array(z.string()).optional(),
});

const updateBasicInfoSchema = z.object({
    title: z.string().trim().min(1).optional(),
    description: z.string().optional(),
    slug: z.string().optional(),
    progress: z.number().int().min(0).max(100).optional(),
    allowIssues: z.boolean().optional(),
    allowFeedback: z.boolean().optional(),
});

const updateStatusSchema = z.object({
    status: z.enum(["DRAFT", "ACTIVE", "PAUSED", "COMPLETED", "ARCHIVED"]).optional(),
    visibility: z.enum(["PUBLIC", "PRIVATE", "UNLISTED"]).optional(),
});

const updateTimelineSchema = z.object({
    startDate: z.string().datetime().optional().nullable(),
    endDate: z.string().datetime().optional().nullable(),
}).refine(data => {
    if (data.startDate && data.endDate) {
        return new Date(data.startDate) <= new Date(data.endDate);
    }
    return true;
}, { message: "Start date cannot be after end date" });

export async function getProjectsForUser(userId: string) {
  return prisma.project.findMany({
    where: { userId },
    select: {
      id: true,
      title: true,
      description: true,
      slug: true,
      status: true,
      visibility: true,
      progress: true,
      banner: true,
      startDate: true,
      endDate: true,
      createdAt: true,
      updatedAt: true,
      user: {
        select: { id: true, name: true, username: true, avatar: true },
      },
      _count: { select: { updates: true, milestones: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function createProject(userId: string, projectData: any) {
  const { name, description, visibility, allowIssues, allowFeedback, tags } =
    createProjectSchema.parse(projectData);

  let slug = generateSlug(name);
  let counter = 1;
  while (!(await isSlugAvailable(slug))) {
    slug = `${generateSlug(name)}-${counter}`;
    counter++;
  }

  const project = await prisma.project.create({
    data: {
      userId,
      title: name,
      description: description || null,
      slug,
      visibility,
      allowIssues,
      allowFeedback,
      startDate: new Date(),
    },
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      visibility: true,
    },
  });

  if (tags && tags.length > 0) {
    for (const tagName of tags) {
      let tag = await prisma.tag.findUnique({
        where: { name: tagName.trim().toLowerCase() },
      });
      if (!tag) {
        tag = await prisma.tag.create({
          data: { name: tagName.trim().toLowerCase() },
        });
      }
      await prisma.projectTag.create({
        data: { projectId: project.id, tagId: tag.id },
      });
    }
  }

  return project;
}

export async function getProjectBasicInfo(projectId: string, userId: string) {
    return verifyProjectOwnership(projectId, userId);
}

export async function getProjectTags(projectId: string, userId: string) {
    await verifyProjectOwnership(projectId, userId);
    const projectTags = await prisma.projectTag.findMany({
        where: { projectId },
        include: { tag: true }
    });
    return projectTags.map((pt: any) => pt.tag);
}

export async function updateProjectBasicInfo(
  projectId: string,
  userId: string,
  projectData: any
) {
  const existingProject = await verifyProjectOwnership(projectId, userId);
  const { title, description, slug, progress, allowIssues, allowFeedback } =
    updateBasicInfoSchema.parse(projectData);

  let finalSlug = existingProject.slug;
  if (slug && slug !== existingProject.slug) {
    const slugAvailable = await isSlugAvailable(slug, projectId);
    if (!slugAvailable) {
      throw new AppError("Slug already taken", 400, "SLUG_TAKEN");
    }
    finalSlug = slug;
  }

  return prisma.project.update({
    where: { id: projectId },
    data: { title, description, slug: finalSlug, progress, allowIssues, allowFeedback },
  });
}

export async function updateProjectStatus(
  projectId: string,
  userId: string,
  statusData: any
) {
  await verifyProjectOwnership(projectId, userId);
  const validatedData = updateStatusSchema.parse(statusData);
  return prisma.project.update({
    where: { id: projectId },
    data: validatedData,
  });
}

export async function updateProjectTimeline(
  projectId: string,
  userId: string,
  timelineData: any
) {
  await verifyProjectOwnership(projectId, userId);
  const { startDate, endDate } = updateTimelineSchema.parse(timelineData);
  return prisma.project.update({
    where: { id: projectId },
    data: { 
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
     },
  });
}

export async function addTagToProject(
  projectId: string,
  userId: string,
  tagName: string
) {
  await verifyProjectOwnership(projectId, userId);
  if (!tagName || !tagName.trim()) {
    throw new AppError("Tag name is required", 400, "MISSING_TAG_NAME");
  }
  const trimmedTagName = tagName.trim().toLowerCase();
  let tag = await prisma.tag.findUnique({ where: { name: trimmedTagName } });
  if (!tag) {
    tag = await prisma.tag.create({ data: { name: trimmedTagName } });
  }
  const existingProjectTag = await prisma.projectTag.findFirst({
    where: { projectId, tagId: tag.id },
  });
  if (existingProjectTag) {
    throw new AppError("Tag already added to project", 400, "TAG_ALREADY_EXISTS");
  }
  await prisma.projectTag.create({
    data: { projectId, tagId: tag.id },
  });
  return tag;
}

export async function removeTagFromProject(
  projectId: string,
  userId: string,
  tagId: string
) {
  await verifyProjectOwnership(projectId, userId);
  const deleted = await prisma.projectTag.deleteMany({
    where: { projectId, tagId },
  });
  if (deleted.count === 0) {
    throw new AppError("Tag not found on project", 404, "TAG_NOT_FOUND");
  }
  return { message: "Tag removed successfully" };
}

export async function getPublicProjectBySlug(slug: string) {
  if (!slug) {
    throw new AppError("Slug parameter is required", 400, "MISSING_SLUG");
  }
  const project = await prisma.project.findUnique({
    where: { slug, visibility: "PUBLIC" },
    select: {
      id: true,
      title: true,
      description: true,
      slug: true,
      status: true,
      visibility: true,
      progress: true,
      banner: true,
      theme: true,
      allowIssues: true,
      allowFeedback: true,
      startDate: true,
      endDate: true,
      user: { select: { name: true, username: true, avatar: true } },
      tags: { select: { tag: { select: { name: true } } } },
      milestones: {
        select: {
          id: true,
          title: true,
          description: true,
          dueDate: true,
          completedAt: true,
          progress: true,
          tasks: {
            select: {
              id: true,
              title: true,
              description: true,
              status: true,
              priority: true,
              dueDate: true,
              completedAt: true,
              estimatedHours: true,
              subtasks: {
                select: {
                  id: true,
                  title: true,
                  completed: true,
                }
              },
              _count: { select: { comments: true } },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { dueDate: 'asc' },
      },
      updates: {
        select: {
          id: true,
          title: true,
          content: true,
          type: true,
          images: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      },
      feedback: {
        select: {
          id: true,
          message: true,
          rating: true,
          category: true,
          submitterName: true,
          submitterEmail: true,
          createdAt: true,
          _count: { select: { comments: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });
  if (!project) {
    throw new AppError("Project not found or not public", 404, "PROJECT_NOT_FOUND");
  }

  const processedProject = {
    ...project,
    updates: project.updates.map(update => ({
      ...update,
      images: update.images ? 
        (() => {
          try {
            return JSON.parse(update.images);
          } catch {
            return [];
          }
        })() : []
    }))
  };

  return processedProject;
}

export async function checkSlugAvailability(slug: string) {
    if (!slug) {
        throw new AppError('Slug parameter is required', 400, 'MISSING_SLUG');
    }
    return { available: await isSlugAvailable(slug) };
} 