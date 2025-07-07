import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  getProjectTags,
  addTagToProject,
} from "../../../../src/services/project.service";
import { AppError } from "../../../../src/lib/error-handler";
import { getUserIdFromToken } from "../../../../src/lib/auth";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  const { id } = req.query;

  if (typeof id !== "string") {
    return res.status(400).json({ error: "Invalid project ID" });
  }

  try {
    const userId = getUserIdFromToken(req);

    switch (req.method) {
      case "GET":
        const tags = await getProjectTags(id, userId);
        return res.status(200).json(tags);

      case "POST":
        if (!req.body || !req.body.tagName) {
          return res.status(400).json({ error: "tagName is required" });
        }
        const newTag = await addTagToProject(id, userId, req.body.tagName);
        return res.status(201).json(newTag);

      default:
        res.setHeader("Allow", ["GET", "POST"]);
        return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    if (error instanceof AppError) {
      return res
        .status(error.statusCode)
        .json({ error: error.message, code: error.code });
    }
    return res.status(500).json({ error: "gj server gg (internal err)" });
  }
} 