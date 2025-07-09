import { prisma } from "../lib/prisma";
import { AppError } from "../lib/error-handler";
import { z } from "zod";

const createFeedbackSchema = z.object({
  message: z.string().trim().min(1, "Message is required"),
  submitterName: z.string().trim().min(1, "Name is required"),
  submitterEmail: z.string().email().optional().or(z.literal("")),
  rating: z.number().int().min(1).max(5),
  category: z
    .enum(["GENERAL", "FEATURE_REQUEST", "IMPROVEMENT", "PRAISE"])
    .default("GENERAL"),
});

export async function createPublicFeedback(slug: string, feedbackData: any) {
  const validatedData = createFeedbackSchema.parse(feedbackData);

  const project = await prisma.project.findFirst({
    where: { slug, visibility: "PUBLIC", allowFeedback: true },
    select: { id: true },
  });

  if (!project) {
    throw new AppError(
      "Project not found or does not accept feedback",
      404,
      "PROJECT_NOT_FOUND"
    );
  }

  const submitterEmail = validatedData.submitterEmail === "" ? null : validatedData.submitterEmail;

  const feedback = await prisma.feedback.create({
    data: {
      projectId: project.id,
      message: validatedData.message,
      rating: validatedData.rating,
      category: validatedData.category,
      submitterName: validatedData.submitterName,
      submitterEmail: submitterEmail,
    },
  });

  return feedback;
}

export async function getPublicFeedback(slug: string) {
  const project = await prisma.project.findFirst({
    where: { slug, visibility: "PUBLIC", allowFeedback: true },
    select: { id: true },
  });

  if (!project) {
    throw new AppError(
      "Project not found or does not accept feedback",
      404,
      "PROJECT_NOT_FOUND"
    );
  }

  const feedback = await prisma.feedback.findMany({
    where: { projectId: project.id },
    orderBy: { createdAt: "desc" },
  });

  return feedback;
}

async function verifyFeedbackOwnership(feedbackId: string, userId: string) {
  const feedback = await prisma.feedback.findUnique({
    where: { id: feedbackId },
    select: { project: { select: { userId: true } } },
  });

  if (!feedback || feedback.project.userId !== userId) {
    throw new AppError(
      "Feedback not found or access denied",
      404,
      "FEEDBACK_NOT_FOUND"
    );
  }
}

export async function getFeedbackForOwner(projectId: string, userId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
    select: { id: true },
  });

  if (!project) {
    throw new AppError(
      "Project not found or access denied",
      404,
      "PROJECT_NOT_FOUND"
    );
  }

  return prisma.feedback.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
  });
}

export async function deleteFeedbackForOwner(feedbackId: string, userId: string) {
  await verifyFeedbackOwnership(feedbackId, userId);
  await prisma.feedbackComment.deleteMany({ where: { feedbackId } });
  await prisma.feedback.delete({ where: { id: feedbackId } });
  return { message: "Feedback deleted successfully" };
}

export async function getFeedbackCommentsForOwner(
  feedbackId: string,
  userId: string
) {
  await verifyFeedbackOwnership(feedbackId, userId);
  return prisma.feedbackComment.findMany({
    where: { feedbackId },
    orderBy: { createdAt: "asc" },
    include: {
      user: { select: { id: true, name: true, username: true, avatar: true } },
    },
  });
}

export async function createFeedbackCommentForOwner(
  feedbackId: string,
  userId: string,
  content: string
) {
  if (!content || content.trim().length === 0) {
    throw new AppError("Comment content is required", 400, "MISSING_CONTENT");
  }

  await verifyFeedbackOwnership(feedbackId, userId);

  return prisma.feedbackComment.create({
    data: {
      feedbackId,
      userId,
      content: content.trim(),
    },
  });
}