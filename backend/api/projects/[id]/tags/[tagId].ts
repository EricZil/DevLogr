import type { VercelRequest, VercelResponse } from "@vercel/node";
import { removeTagFromProject } from "../../../../src/services/project.service";
import { AppError } from "../../../../src/lib/error-handler";
import { getUserIdFromToken } from "../../../../src/lib/auth";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  const { id, tagId } = req.query;

  if (typeof id !== "string" || typeof tagId !== "string") {
    return res.status(400).json({ error: "Invalid project or tag ID" });
  }

  try {
    if (req.method !== "DELETE") {
      res.setHeader("Allow", ["DELETE"]);
      return res.status(405).json({ error: "Method not allowed" });
    }

    const userId = getUserIdFromToken(req);
    const result = await removeTagFromProject(id, userId, tagId);

    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof AppError) {
      return res
        .status(error.statusCode)
        .json({ error: error.message, code: error.code });
    }
    return res.status(500).json({ error: "gj server gg (internal err)" });
  }
} 