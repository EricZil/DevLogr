import type { VercelRequest, VercelResponse } from "@vercel/node";
import { AppError } from "../../../src/lib/error-handler";
import crypto from 'crypto';

export default function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      throw new AppError('Google OAuth not configured', 500, 'OAUTH_NOT_CONFIGURED');
    }
    
    const state = crypto.randomBytes(32).toString('hex');
    const redirectUri = `${process.env.API_URL}/api/oauth/google/callback`;
    
    const googleAuthUrl = 'https://accounts.google.com/o/oauth2/v2/auth?' + 
      `client_id=${clientId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent('openid email profile')}` +
      `&state=${state}`;

    res.redirect(302, googleAuthUrl);
  } catch (error: any) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error("OAuth Error:", error);
    return res.status(500).json({ error: "gj server gg (internal err)" });
  }
} 