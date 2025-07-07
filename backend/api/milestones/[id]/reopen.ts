import type { VercelRequest, VercelResponse } from "@vercel/node";
import { reopenMilestone } from "../../../src/services/milestone.service";
import { AppError } from "../../../src/lib/error-handler";
import { getUserIdFromToken } from "../../../src/lib/auth";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  const { id } = req.query;

  if (typeof id !== "string") {
    return res.status(400).json({ error: "Invalid milestone ID" });
  }

  try {
    if (req.method !== "PUT") {
      res.setHeader("Allow", ["PUT"]);
      return res.status(405).json({ error: "Method not allowed" });
    }

    const userId = getUserIdFromToken(req);
    const milestone = await reopenMilestone(id, userId);

    return res.status(200).json(milestone);
  } catch (error) {
    if (error instanceof AppError) {
      return res
        .status(error.statusCode)
        .json({ error: error.message, code: error.code });
    }
    return res.status(500).json({ error: "gj server gg (internal err)" });
  }
} 