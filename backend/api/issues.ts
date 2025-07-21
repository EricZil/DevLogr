import type { VercelRequest, VercelResponse } from "@vercel/node";
import { updateIssue, createIssueCommentForOwner } from "../src/services/issue.service";
import { getIssueComments } from "../src/services/issue.public.service";
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
    const { id, action } = req.query;

    if (typeof id !== "string") {
      return res.status(400).json({ success: false, error: "Invalid issue ID" });
    }

    const userId = getUserIdFromToken(req);

    if (action === 'comments') {
      switch (req.method) {
        case "GET":
          const comments = await getIssueComments(id);
          return res.status(200).json({ success: true, data: comments });

        case "POST":
          if (!req.body || !req.body.content) {
            return res.status(400).json({ success: false, error: "Content is required" });
          }
          const newComment = await createIssueCommentForOwner(
            id,
            userId,
            req.body.content
          );
          return res.status(201).json({ success: true, data: newComment });

        default:
          res.setHeader("Allow", ["GET", "POST"]);
          return res.status(405).json({ success: false, error: "Method not allowed" });
      }
    }

    switch (req.method) {
      case "PATCH":
        const updatedIssue = await updateIssue(id, userId, req.body);
        return res.status(200).json({ success: true, data: updatedIssue });

      default:
        res.setHeader("Allow", ["PATCH"]);
        return res.status(405).json({ success: false, error: "Method not allowed" });
    }
  } catch (error) {
    if (error instanceof AppError) {
      return res
        .status(error.statusCode)
        .json({ success: false, error: error.message, code: error.code });
    }
    console.error("gj server gg (internal err):", error);
    return res.status(500).json({ error: "gj server gg (internal err)" });
  }
} 