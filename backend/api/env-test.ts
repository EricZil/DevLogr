import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const requiredEnvVars = [
      'GITHUB_CLIENT_ID',
      'GITHUB_CLIENT_SECRET', 
      'GOOGLE_CLIENT_ID',
      'GOOGLE_CLIENT_SECRET',
      'API_URL',
      'FRONTEND_URL',
      'DATABASE_URL'
    ];

    const envStatus = requiredEnvVars.reduce((acc, envVar) => {
      acc[envVar] = process.env[envVar] ? 'SET' : 'MISSING';
      return acc;
    }, {} as Record<string, string>);

    return res.status(200).json({ 
      message: "Environment variables check",
      envStatus,
      nodeEnv: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("Env test error:", error);
    return res.status(500).json({ error: "gj server gg (internal err)" });
  }
} 