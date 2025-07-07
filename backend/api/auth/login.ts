import type { VercelRequest, VercelResponse } from "@vercel/node";
import { loginUser } from "../../src/services/auth.service";
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

    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const result = await loginUser(req.body, ipAddress, userAgent);
    return res.status(200).json(result);

  } catch (error: any) {
    if (error instanceof AppError) {
      return res
        .status(error.statusCode)
        .json({ error: error.message, code: error.code });
    }
     if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    return res.status(500).json({ error: "gj server gg (internal err)" });
  }
} 