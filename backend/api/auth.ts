import type { VercelRequest, VercelResponse } from "@vercel/node";
import { loginUser, registerUser, logoutUser, refreshUserToken, getMe } from "../src/services/auth.service";
import { AppError } from "../src/lib/error-handler";
import { getUserIdFromToken } from "../src/lib/auth";
import { applyCors } from "../src/lib/cors";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    await applyCors(req, res);

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    const { action } = req.query;
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    switch (action) {
      case 'login':
        if (req.method !== "POST") {
          res.setHeader("Allow", ["POST"]);
          return res.status(405).json({ success: false, error: "Method not allowed" });
        }
        const loginResult = await loginUser(req.body, ipAddress, userAgent);
        return res.status(200).json({ success: true, data: loginResult });

      case 'register':
        if (req.method !== "POST") {
          res.setHeader("Allow", ["POST"]);
          return res.status(405).json({ success: false, error: "Method not allowed" });
        }
        const registerResult = await registerUser(req.body, ipAddress, userAgent);
        return res.status(201).json({ success: true, data: registerResult });

      case 'logout':
        if (req.method !== "POST") {
          res.setHeader("Allow", ["POST"]);
          return res.status(405).json({ success: false, error: "Method not allowed" });
        }
        const token = req.headers.authorization?.replace('Bearer ', '');
        const logoutResult = await logoutUser(token || '');
        return res.status(200).json({ success: true, data: logoutResult });

      case 'refresh-token':
        if (req.method !== "POST") {
          res.setHeader("Allow", ["POST"]);
          return res.status(405).json({ success: false, error: "Method not allowed" });
        }
        const { token: refreshToken } = req.body;
        const refreshResult = await refreshUserToken(refreshToken);
        return res.status(200).json({ success: true, data: refreshResult });

      case 'me':
        if (req.method !== "GET") {
          res.setHeader("Allow", ["GET"]);
          return res.status(405).json({ success: false, error: "Method not allowed" });
        }
        const userId = getUserIdFromToken(req);
        const user = await getMe(userId);
        return res.status(200).json({ success: true, data: user });

      default:
        return res.status(404).json({ success: false, error: "Auth action not found" });
    }

  } catch (error: any) {
    if (error instanceof AppError) {
      return res
        .status(error.statusCode)
        .json({ success: false, message: error.message, error: error.message, code: error.code });
    }
    if (error.name === 'ZodError') {
      return res.status(400).json({ success: false, message: 'Validation failed', error: 'Validation failed', details: error.errors });
    }
    return res.status(500).json({ success: false, message: "GG", error: "gj server gg (internal err)" });
  }
} 