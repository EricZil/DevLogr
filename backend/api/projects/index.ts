import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  getProjectsForUser,
  createProject,
} from "../../src/services/project.service";
import { AppError } from "../../src/lib/error-handler";
import { getUserIdFromToken } from "../../src/lib/auth";
import { applyCors } from "../../src/lib/cors";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    await applyCors(req, res);

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    const userId = getUserIdFromToken(req);

    switch (req.method) {
      case "GET":
        const projects = await getProjectsForUser(userId);
        return res.status(200).json({ success: true, data: projects });

      case "POST":
        const newProject = await createProject(userId, req.body);
        return res.status(201).json({ success: true, data: newProject });

      default:
        res.setHeader("Allow", ["GET", "POST"]);
        return res.status(405).json({ success: false, error: "Method not allowed" });
    }
  } catch (error) {
    if (error instanceof AppError) {
      return res
        .status(error.statusCode)
        .json({ success: false, error: error.message, code: error.code });
    }
    return res.status(500).json({ success: false, error: "gj server gg (internal err)" });
  }
} 