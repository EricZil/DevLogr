import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  getTasksForMilestone,
  createTask,
} from "../../../src/services/task.service";
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
    const userId = getUserIdFromToken(req);

    switch (req.method) {
      case "GET":
        const tasks = await getTasksForMilestone(id, userId);
        return res.status(200).json(tasks);

      case "POST":
        const newTask = await createTask(id, userId, req.body);
        return res.status(201).json(newTask);

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