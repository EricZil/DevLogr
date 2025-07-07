import type { VercelRequest, VercelResponse } from "@vercel/node";
import { AppError } from "../../../src/lib/error-handler";
import crypto from 'crypto';

export default function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const clientId = process.env.GITHUB_CLIENT_ID;
    if (!clientId) {
      throw new AppError('GitHub OAuth not configured', 500, 'OAUTH_NOT_CONFIGURED');
    }
    
    const state = crypto.randomBytes(32).toString('hex');
    const redirectUri = `${process.env.API_URL}/api/oauth/github/callback`;
    
    const githubAuthUrl = 'https://github.com/login/oauth/authorize?' + 
      `client_id=${clientId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${encodeURIComponent('user:email')}` +
      `&state=${state}`;

    res.redirect(302, githubAuthUrl);
  } catch (error: any) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error("OAuth Error:", error);
    return res.status(500).json({ error: "gj server gg (internal err)" });
  }
} 