import type { VercelRequest, VercelResponse } from "@vercel/node";
import { refreshUserToken } from "../../src/services/auth.service";
import { AppError } from "../../src/lib/error-handler";
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

    if (req.method !== "POST") {
      res.setHeader("Allow", ["POST"]);
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { token } = req.body;
    const result = await refreshUserToken(token);
    
    return res.status(200).json(result);

  } catch (error) {
    if (error instanceof AppError) {
      return res
        .status(error.statusCode)
        .json({ error: error.message, code: error.code });
    }
    return res.status(500).json({ error: "gj server gg (internal err)" });
  }
} 