import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  updateSubtask,
  deleteSubtask,
} from "../../src/services/task.service";
import { AppError } from "../../src/lib/error-handler";
import { getUserIdFromToken } from "../../src/lib/auth";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  const { id } = req.query;

  if (typeof id !== "string") {
    return res.status(400).json({ error: "Invalid subtask ID" });
  }

  try {
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
    return res.status(500).json({ error: "gj server gg (internal err)" });
  }
} 