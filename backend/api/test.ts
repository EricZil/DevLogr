import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    return res.status(200).json({ 
      message: "Test endpoint working!", 
      method: req.method,
      query: req.query,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("Test endpoint error:", error);
    return res.status(500).json({ error: "gj server gg (internal err)" });
  }
} 