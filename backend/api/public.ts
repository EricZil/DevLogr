import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  getPublicFeedback,
  createPublicFeedback,
} from "../src/services/feedback.service";
import {
  getPublicIssues,
  createPublicIssue,
} from "../src/services/issue.public.service";
import { AppError } from "../src/lib/error-handler";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    const { slug, type } = req.query;

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
    console.error("gj server gg (internal err):", error);
    return res.status(500).json({ error: "gj server gg (internal err)" });
  }
} 