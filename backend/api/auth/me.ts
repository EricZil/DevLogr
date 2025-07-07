import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getMe } from "../../src/services/auth.service";
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

    if (req.method !== "GET") {
      res.setHeader("Allow", ["GET"]);
      return res.status(405).json({ success: false, error: "Method not allowed" });
    }

    const userId = getUserIdFromToken(req);
    const user = await getMe(userId);

    return res.status(200).json({ success: true, data: user });

  } catch (error) {
    if (error instanceof AppError) {
      return res
        .status(error.statusCode)
        .json({ success: false, error: error.message, code: error.code });
    }
    return res.status(500).json({ success: false, error: "gj server gg (internal err)" });
  }
} 