import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/error-handler";
import { z } from "zod";

const createIssueSchema = z.object({
  title: z.string().trim().min(1, "Issue title is required"),
  description: z.string().trim().min(1, "Issue description is required"),
  reporterName: z.string().trim().min(1, "Reporter name is required"),
  reporterEmail: z.string().email().optional().or(z.literal("")),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
  category: z
    .enum(["BUG", "FEATURE_REQUEST", "IMPROVEMENT", "QUESTION"])
    .default("BUG"),
});

export async function getPublicIssues(slug: string) {
  if (!slug) {
    throw new AppError(
      "Project slug is required",
      400,
      "MISSING_PROJECT_SLUG"
    );
  }

  const project = await prisma.project.findFirst({
    where: {
      slug,
      visibility: "PUBLIC",
      allowIssues: true,
    },
    select: { id: true },
  });

  if (!project) {
    throw new AppError(
      "Project not found or does not accept issues",
      404,
      "PROJECT_NOT_FOUND"
    );
  }

  const issues = await prisma.issue.findMany({
    where: { projectId: project.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { comments: true } } },
  });

  return issues;
}

export async function createPublicIssue(slug: string, issueData: any) {
  if (!slug) {
    throw new AppError(
      "Project slug is required",
      400,
      "MISSING_PROJECT_SLUG"
    );
  }

  const validatedData = createIssueSchema.parse(issueData);

  const project = await prisma.project.findFirst({
    where: {
      slug,
      visibility: "PUBLIC",
      allowIssues: true,
    },
    select: { id: true },
  });

  if (!project) {
    throw new AppError(
      "Project not found or does not accept issues",
      404,
      "PROJECT_NOT_FOUND"
    );
  }

  const issue = await prisma.issue.create({
    data: {
      projectId: project.id,
      ...validatedData,
      reporterEmail: validatedData.reporterEmail || null,
      status: "OPEN",
    },
  });

  return issue;
}

export async function getIssueComments(issueId: string) {
  if (!issueId) {
    throw new AppError("Issue ID is required", 400, "MISSING_ISSUE_ID");
  }

  const comments = await prisma.issueComment.findMany({
    where: { issueId: issueId },
    orderBy: { createdAt: "asc" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          username: true,
          avatar: true,
        },
      },
    },
  });

  return comments;
} 