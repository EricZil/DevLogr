import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  getMilestone,
  updateMilestone,
  deleteMilestone,
  completeMilestone,
  reopenMilestone,
} from "../src/services/milestone.service";
import {
  getTasksForMilestone,
  createTask,
} from "../src/services/task.service";
import { AppError } from "../src/lib/error-handler";
import { getUserIdFromToken } from "../src/lib/auth";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    const { id, action } = req.query;

    if (typeof id !== "string") {
      return res.status(400).json({ success: false, error: "Invalid milestone ID" });
    }

    const userId = getUserIdFromToken(req);

    if (action === 'tasks') {
      switch (req.method) {
        case "GET":
          const tasks = await getTasksForMilestone(id, userId);
          return res.status(200).json({ success: true, data: tasks });

        case "POST":
          const newTask = await createTask(id, userId, req.body);
          return res.status(201).json({ success: true, data: newTask });

        default:
          res.setHeader("Allow", ["GET", "POST"]);
          return res.status(405).json({ success: false, error: "Method not allowed" });
      }
    }

    if (action === 'complete') {
      if (req.method !== "PUT") {
        res.setHeader("Allow", ["PUT"]);
        return res.status(405).json({ success: false, error: "Method not allowed" });
      }

      const milestone = await completeMilestone(id, userId);
      return res.status(200).json({ success: true, data: milestone });
    }

    if (action === 'reopen') {
      if (req.method !== "PUT") {
        res.setHeader("Allow", ["PUT"]);
        return res.status(405).json({ success: false, error: "Method not allowed" });
      }

      const milestone = await reopenMilestone(id, userId);
      return res.status(200).json({ success: true, data: milestone });
    }

    switch (req.method) {
      case "GET":
        const milestone = await getMilestone(id, userId);
        return res.status(200).json({ success: true, data: milestone });

      case "PUT":
        const updatedMilestone = await updateMilestone(id, userId, req.body);
        return res.status(200).json({ success: true, data: updatedMilestone });

      case "DELETE":
        const result = await deleteMilestone(id, userId);
        return res.status(200).json({ success: true, data: result });

      default:
        res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
        return res.status(405).json({ success: false, error: "Method not allowed" });
    }
  } catch (error) {
    if (error instanceof AppError) {
      return res
        .status(error.statusCode)
        .json({ success: false, message: error.message, error: error.message, code: error.code });
    }
    return res.status(500).json({ success: false, message: "GG", error: "gj server gg (internal err)" });
  }
} 