import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  getPublicFeedback,
  createPublicFeedback,
} from "../src/services/feedback.service";
import {
  getPublicIssues,
  createPublicIssue,
  getIssueComments,
} from "../src/services/issue.public.service";
import {
  getPublicProjectBySlug,
} from "../src/services/project.service";
import { AppError } from "../src/lib/error-handler";
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

    const { slug, action, issueId, type } = req.query;

    if (typeof action === "string") {
      switch (action) {
        case 'project':
          if (typeof slug !== "string") {
            return res.status(400).json({ error: "Invalid project slug" });
          }
          if (req.method !== "GET") {
            res.setHeader("Allow", ["GET"]);
            return res.status(405).json({ error: "Method not allowed" });
          }
          const project = await getPublicProjectBySlug(slug);
          return res.status(200).json(project);

        case 'issues':
          if (typeof slug !== "string") {
            return res.status(400).json({ error: "Invalid project slug" });
          }
          if (req.method !== "GET") {
            res.setHeader("Allow", ["GET"]);
            return res.status(405).json({ error: "Method not allowed" });
          }
          const issues = await getPublicIssues(slug);
          return res.status(200).json(issues);

        case 'create-issue':
          if (typeof slug !== "string") {
            return res.status(400).json({ error: "Invalid project slug" });
          }
          if (req.method !== "POST") {
            res.setHeader("Allow", ["POST"]);
            return res.status(405).json({ error: "Method not allowed" });
          }
          const newIssue = await createPublicIssue(slug, req.body);
          return res.status(201).json(newIssue);

        case 'create-feedback':
          if (typeof slug !== "string") {
            return res.status(400).json({ error: "Invalid project slug" });
          }
          if (req.method !== "POST") {
            res.setHeader("Allow", ["POST"]);
            return res.status(405).json({ error: "Method not allowed" });
          }
          const newFeedback = await createPublicFeedback(slug, req.body);
          return res.status(201).json(newFeedback);

        case 'issue-comments':
          if (typeof issueId !== "string") {
            return res.status(400).json({ error: "Invalid issue ID" });
          }
          if (req.method !== "GET") {
            res.setHeader("Allow", ["GET"]);
            return res.status(405).json({ error: "Method not allowed" });
          }
          const comments = await getIssueComments(issueId);
          return res.status(200).json(comments);

        default:
          return res.status(404).json({ error: "Public action not found" });
      }
    }

    if (typeof slug !== "string") {
      return res.status(400).json({ error: "Invalid project slug" });
    }

    switch (type) {
      case 'feedback':
        switch (req.method) {
          case "GET":
            const feedback = await getPublicFeedback(slug);
            return res.status(200).json(feedback);

          case "POST":
            const newFeedback = await createPublicFeedback(slug, req.body);
            return res.status(201).json(newFeedback);

          default:
            res.setHeader("Allow", ["GET", "POST"]);
            return res.status(405).json({ error: "Method not allowed" });
        }
        break;

      case 'issues':
        switch (req.method) {
          case "GET":
            const issues = await getPublicIssues(slug);
            return res.status(200).json(issues);

          case "POST":
            const newIssue = await createPublicIssue(slug, req.body);
            return res.status(201).json(newIssue);

          default:
            res.setHeader("Allow", ["GET", "POST"]);
            return res.status(405).json({ error: "Method not allowed" });
        }
        break;

      default:
        return res.status(404).json({ error: "Public endpoint type not found" });
    }
  } catch (error) {
    if (error instanceof AppError) {
      return res
        .status(error.statusCode)
        .json({ error: error.message, code: error.code });
    }
    console.error("Internal Server Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
} 