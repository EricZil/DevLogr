import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getUserProfile } from "../../src/services/user.service";
import { AppError } from "../../src/lib/error-handler";
import { getUserIdFromToken } from "../../src/lib/auth";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    if (req.method !== "GET") {
      res.setHeader("Allow", ["GET"]);
      return res.status(405).json({ error: "Method not allowed" });
    }

    // This route must be protected
    const userId = getUserIdFromToken(req);
    
    // The service function will need to be updated to accept the userId
    const userProfile = await getUserProfile(userId);

    return res.status(200).json(userProfile);
  } catch (error) {
    if (error instanceof AppError) {
      return res
        .status(error.statusCode)
        .json({ error: error.message, code: error.code });
    }
    console.error("Internal Server Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
} 