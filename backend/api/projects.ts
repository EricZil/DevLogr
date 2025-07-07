import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  getProjectsForUser,
  createProject,
  getProjectBasicInfo,
  updateProjectBasicInfo,
  updateProjectStatus,
  updateProjectTimeline,
  getProjectTags,
  addTagToProject,
  removeTagFromProject,
  checkSlugAvailability,
  getPublicProjectBySlug,
  getPublicProjectByDomain,
  verifyProjectDomain,
  getDomainVerificationStatus,
} from "../src/services/project.service";
import {
  getTasksForProject,
} from "../src/services/task.service";
import {
  getIssuesForOwner,
  createIssueForOwner,
} from "../src/services/issue.service";
import {
  getFeedbackForOwner,
} from "../src/services/feedback.service";
import {
  getMilestonesForProject,
  createMilestone,
  getMilestoneStats,
} from "../src/services/milestone.service";
import {
  getUpdatesForProject,
  createUpdate,
  getUpdateStats,
} from "../src/services/update.service";
import { AppError } from "../src/lib/error-handler";
import { getUserIdFromToken } from "../src/lib/auth";
import { applyCors } from "../src/lib/cors";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    await applyCors(req, res);

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    const { id, action, subaction, slug, tagId } = req.query;

    if (!id && !action && !slug) {
      const userId = getUserIdFromToken(req);

      switch (req.method) {
        case "GET":
          const projects = await getProjectsForUser(userId);
          return res.status(200).json({ success: true, data: projects });

        case "POST":
          const newProject = await createProject(userId, req.body);
          return res.status(201).json({ success: true, data: newProject });

        default:
          res.setHeader("Allow", ["GET", "POST"]);
          return res.status(405).json({ success: false, error: "Method not allowed" });
      }
    }

    if (action === 'check-slug' && typeof slug === 'string') {
      if (req.method !== "GET") {
        res.setHeader("Allow", ["GET"]);
        return res.status(405).json({ error: "Method not allowed" });
      }

      const result = await checkSlugAvailability(slug);
      return res.status(200).json(result);
    }

    if (action === 'public') {
      if (req.method !== "GET") {
        res.setHeader("Allow", ["GET"]);
        return res.status(405).json({ error: "Method not allowed" });
      }

      const { slug: slugParam, domain } = req.query;
      
      if (typeof slugParam === 'string') {
        const project = await getPublicProjectBySlug(slugParam);
        return res.status(200).json({ success: true, data: project });
      } else if (typeof domain === 'string') {
        const project = await getPublicProjectByDomain(domain);
        return res.status(200).json({ success: true, data: project });
      } else {
        return res.status(400).json({ success: false, error: "Either slug or domain parameter is required" });
      }
    }

    if (typeof id !== "string") {
      return res.status(400).json({ success: false, error: "Invalid project ID" });
    }

    const userId = getUserIdFromToken(req);

    if (action === 'basic') {
      if (req.method !== "GET") {
        res.setHeader("Allow", ["GET"]);
        return res.status(405).json({ error: "Method not allowed" });
      }

      const project = await getProjectBasicInfo(id, userId);
      return res.status(200).json({ success: true, data: project });
    }

    if (action === 'basic-info') {
      if (req.method !== "PUT") {
        res.setHeader("Allow", ["PUT"]);
        return res.status(405).json({ error: "Method not allowed" });
      }

      const project = await updateProjectBasicInfo(id, userId, req.body);
      return res.status(200).json({ success: true, data: project });
    }

    if (action === 'status') {
      if (req.method !== "PUT") {
        res.setHeader("Allow", ["PUT"]);
        return res.status(405).json({ error: "Method not allowed" });
      }

      const project = await updateProjectStatus(id, userId, req.body);
      return res.status(200).json({ success: true, data: project });
    }

    if (action === 'timeline') {
      if (req.method !== "PUT") {
        res.setHeader("Allow", ["PUT"]);
        return res.status(405).json({ error: "Method not allowed" });
      }

      const project = await updateProjectTimeline(id, userId, req.body);
      return res.status(200).json({ success: true, data: project });
    }

    if (action === 'verify-domain') {
      if (req.method !== "POST") {
        res.setHeader("Allow", ["POST"]);
        return res.status(405).json({ error: "Method not allowed" });
      }

      const result = await verifyProjectDomain(id, userId);
      return res.status(200).json(result);
    }

    if (action === 'domain-status') {
      if (req.method !== "GET") {
        res.setHeader("Allow", ["GET"]);
        return res.status(405).json({ error: "Method not allowed" });
      }

      const result = await getDomainVerificationStatus(id, userId);
      return res.status(200).json(result);
    }

    if (action === 'tasks') {
      if (req.method !== "GET") {
        res.setHeader("Allow", ["GET"]);
        return res.status(405).json({ error: "Method not allowed" });
      }

      const tasks = await getTasksForProject(id, userId);
      return res.status(200).json({ success: true, data: tasks });
    }

    if (action === 'issues') {
      switch (req.method) {
        case "GET":
          const issues = await getIssuesForOwner(id, userId);
          return res.status(200).json({ success: true, data: issues });

        case "POST":
          const newIssue = await createIssueForOwner(id, userId, req.body);
          return res.status(201).json({ success: true, data: newIssue });

        default:
          res.setHeader("Allow", ["GET", "POST"]);
          return res.status(405).json({ error: "Method not allowed" });
      }
    }

    if (action === 'feedback') {
      if (req.method !== "GET") {
        res.setHeader("Allow", ["GET"]);
        return res.status(405).json({ error: "Method not allowed" });
      }

      const feedback = await getFeedbackForOwner(id, userId);
      return res.status(200).json({ success: true, data: feedback });
    }

    if (action === 'tags') {
      if (typeof tagId === 'string') {
        if (req.method !== "DELETE") {
          res.setHeader("Allow", ["DELETE"]);
          return res.status(405).json({ error: "Method not allowed" });
        }

        const result = await removeTagFromProject(id, userId, tagId);
        return res.status(200).json(result);
      }

      switch (req.method) {
        case "GET":
          const tags = await getProjectTags(id, userId);
          return res.status(200).json({ success: true, data: tags });

        case "POST":
          if (!req.body || !req.body.tagName) {
            return res.status(400).json({ success: false, error: "tagName is required" });
          }
          const newTag = await addTagToProject(id, userId, req.body.tagName);
          return res.status(201).json({ success: true, data: newTag });

        default:
          res.setHeader("Allow", ["GET", "POST"]);
          return res.status(405).json({ error: "Method not allowed" });
      }
    }

    if (action === 'milestones') {
      if (subaction === 'stats') {
        if (req.method !== "GET") {
          res.setHeader("Allow", ["GET"]);
          return res.status(405).json({ error: "Method not allowed" });
        }

        const stats = await getMilestoneStats(id, userId);
        return res.status(200).json({ success: true, data: stats });
      }

      switch (req.method) {
        case "GET":
          const milestones = await getMilestonesForProject(id, userId);
          return res.status(200).json({ success: true, data: milestones });

        case "POST":
          const newMilestone = await createMilestone(id, userId, req.body);
          return res.status(201).json({ success: true, data: newMilestone });

        default:
          res.setHeader("Allow", ["GET", "POST"]);
          return res.status(405).json({ error: "Method not allowed" });
      }
    }

    if (action === 'updates') {
      if (subaction === 'stats') {
        if (req.method !== "GET") {
          res.setHeader("Allow", ["GET"]);
          return res.status(405).json({ error: "Method not allowed" });
        }

        const stats = await getUpdateStats(id, userId);
        return res.status(200).json({ success: true, data: stats });
      }

      switch (req.method) {
        case "GET":
          const updates = await getUpdatesForProject(id, userId);
          return res.status(200).json({ success: true, data: updates });

        case "POST":
          const newUpdate = await createUpdate(id, userId, req.body);
          return res.status(201).json({ success: true, data: newUpdate });

        default:
          res.setHeader("Allow", ["GET", "POST"]);
          return res.status(405).json({ error: "Method not allowed" });
      }
    }

    return res.status(404).json({ success: false, error: "Project action not found" });

  } catch (error) {
    if (error instanceof AppError) {
      return res
        .status(error.statusCode)
        .json({ success: false, message: error.message, error: error.message, code: error.code });
    }
    return res.status(500).json({ success: false, message: "GG", error: "gj server gg (internal err)" });
  }
} 