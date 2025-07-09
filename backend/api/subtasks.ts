import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  updateSubtask,
  deleteSubtask,
} from "../src/services/task.service";
import { AppError } from "../src/lib/error-handler";
import { getUserIdFromToken } from "../src/lib/auth";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    const origin = req.headers.origin;
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
    
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
      res.setHeader('Access-Control-Max-Age', '86400'); // 24 hrs
      return res.status(204).end();
    }

    const { id } = req.query;

    if (typeof id !== "string") {
      return res.status(400).json({ error: "Invalid subtask ID" });
    }

    const userId = getUserIdFromToken(req);

    switch (req.method) {
      case "PUT":
        const updatedSubtask = await updateSubtask(id, userId, req.body);
        return res.status(200).json(updatedSubtask);

      case "DELETE":
        const result = await deleteSubtask(id, userId);
        return res.status(200).json(result);

      default:
        res.setHeader("Allow", ["PUT", "DELETE"]);
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