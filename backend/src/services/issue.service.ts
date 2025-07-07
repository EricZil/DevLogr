import { prisma } from "../lib/prisma";
import { AppError } from "../lib/error-handler";
import { z } from "zod";

async function verifyIssueOwnership(issueId: string, userId: string) {
  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    select: { project: { select: { userId: true } } },
  });

  if (!issue || issue.project.userId !== userId) {
    throw new AppError("Issue not found or access denied", 404, "ISSUE_NOT_FOUND");
  }
}

const issueSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().trim().min(1, "Description is required"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
  category: z
    .enum(["BUG", "FEATURE_REQUEST", "IMPROVEMENT", "QUESTION"])
    .default("BUG"),
  status: z.enum(["OPEN", "IN_PROGRESS", "CLOSED"]).default("OPEN"),
});

const updateIssueSchema = issueSchema.partial();

export async function getIssuesForOwner(projectId: string, userId: string) {
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
  return prisma.issue.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { comments: true } } },
  });
}

export async function createIssueForOwner(
  projectId: string,
  userId: string,
  issueData: any
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

  const validatedData = issueSchema.parse(issueData);

  return prisma.issue.create({
    data: {
      projectId,
      ...validatedData,
      reporterId: userId,
      reporterName: "Owner",
    },
  });
}

export async function updateIssue(issueId: string, userId: string, issueData: any) {
  await verifyIssueOwnership(issueId, userId);
  const validatedData = updateIssueSchema.parse(issueData);
  return prisma.issue.update({
    where: { id: issueId },
    data: validatedData,
  });
}

export async function createIssueCommentForOwner(
  issueId: string,
  userId: string,
  content: string
) {
  if (!content || content.trim().length === 0) {
    throw new AppError("Comment content is required", 400, "MISSING_CONTENT");
  }
  await verifyIssueOwnership(issueId, userId);
  return prisma.issueComment.create({
    data: {
      issueId,
      userId,
      content: content.trim(),
    },
  });
} 