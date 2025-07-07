import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createSubtask } from "../../../src/services/task.service";
import { AppError } from "../../../src/lib/error-handler";
import { getUserIdFromToken } from "../../../src/lib/auth";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  const { id } = req.query;

  if (typeof id !== "string") {
    return res.status(400).json({ error: "Invalid task ID" });
  }

  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", ["POST"]);
      return res.status(405).json({ error: "Method not allowed" });
    }

    const userId = getUserIdFromToken(req);
    const newSubtask = await createSubtask(id, userId, req.body);

    return res.status(201).json(newSubtask);
  } catch (error) {
    if (error instanceof AppError) {
      return res
        .status(error.statusCode)
        .json({ error: error.message, code: error.code });
    }
    return res.status(500).json({ error: "gj server gg (internal err)" });
  }
} 