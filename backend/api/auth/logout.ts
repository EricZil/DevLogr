import type { VercelRequest, VercelResponse } from "@vercel/node";
import { logoutUser } from "../../src/services/auth.service";
import { AppError } from "../../src/lib/error-handler";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", ["POST"]);
      return res.status(405).json({ error: "Method not allowed" });
    }
    
    const token = req.headers.authorization?.replace('Bearer ', '');
    const result = await logoutUser(token || '');
    
    return res.status(200).json(result);

  } catch (error: any) {
    if (error instanceof AppError) {
      return res
        .status(error.statusCode)
        .json({ error: error.message, code: error.code });
    }
    return res.status(500).json({ error: "gj server gg (internal err)" });
  }
} 