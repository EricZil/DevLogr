import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getUpdateStats } from "../../../../src/services/update.service";
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
    if (req.method !== "GET") {
      res.setHeader("Allow", ["GET"]);
      return res.status(405).json({ error: "Method not allowed" });
    }

    const userId = getUserIdFromToken(req);
    const stats = await getUpdateStats(id, userId);

    return res.status(200).json(stats);
  } catch (error) {
    if (error instanceof AppError) {
      return res
        .status(error.statusCode)
        .json({ error: error.message, code: error.code });
    }
    return res.status(500).json({ error: "gj server gg (internal err)" });
  }
} 