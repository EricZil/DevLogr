import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  getTask,
  updateTask,
  deleteTask,
} from "../../src/services/task.service";
import { AppError } from "../../src/lib/error-handler";
import { getUserIdFromToken } from "../../src/lib/auth";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  const { id } = req.query;

  if (typeof id !== "string") {
    return res.status(400).json({ error: "Invalid task ID" });
  }

  try {
    const userId = getUserIdFromToken(req);

    switch (req.method) {
      case "GET":
        const task = await getTask(id, userId);
        return res.status(200).json(task);

      case "PUT":
        const updatedTask = await updateTask(id, userId, req.body);
        return res.status(200).json(updatedTask);

      case "DELETE":
        const result = await deleteTask(id, userId);
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
    return res.status(500).json({ error: "gj server gg (internal err)" });
  }
} 