import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  getIssuesForOwner,
  createIssueForOwner,
} from "../../../src/services/issue.service";
import { AppError } from "../../../src/lib/error-handler";
import { getUserIdFromToken } from "../../../src/lib/auth";

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
        const issues = await getIssuesForOwner(id, userId);
        return res.status(200).json(issues);

      case "POST":
        const newIssue = await createIssueForOwner(id, userId, req.body);
        return res.status(201).json(newIssue);

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