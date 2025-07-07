import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  getUpdate,
  updateAnUpdate,
  deleteUpdate,
  getRecentUpdates,
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

    const { id, action } = req.query;
    const userId = getUserIdFromToken(req);

    if (action === 'recent') {
      if (req.method !== "GET") {
        res.setHeader("Allow", ["GET"]);
        return res.status(405).json({ success: false, error: "Method not allowed" });
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 5;
      const updates = await getRecentUpdates(userId, limit);
      return res.status(200).json({ success: true, data: updates });
    }

    if (typeof id !== "string") {
      return res.status(400).json({ error: "Invalid update ID" });
    }

    switch (req.method) {
      case "GET":
        const update = await getUpdate(id, userId);
        return res.status(200).json(update);

      case "PUT":
        const updatedUpdate = await updateAnUpdate(id, userId, req.body);
        return res.status(200).json(updatedUpdate);

      case "DELETE":
        const result = await deleteUpdate(id, userId);
        return res.status(200).json(result);

      default:
        res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
        return res.status(405).json({ error: "Method not allowed" });
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