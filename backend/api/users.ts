import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getUserProfile } from "../src/services/user.service";
import { AppError } from "../src/lib/error-handler";
import { getUserIdFromToken } from "../src/lib/auth";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    const { action } = req.query;

    switch (action) {
      case 'profile':
        if (req.method !== "GET") {
          res.setHeader("Allow", ["GET"]);
          return res.status(405).json({ error: "Method not allowed" });
        }

        const userId = getUserIdFromToken(req);
        const userProfile = await getUserProfile(userId);
        return res.status(200).json(userProfile);

      default:
        return res.status(404).json({ error: "User action not found" });
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