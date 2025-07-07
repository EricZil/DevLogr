import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleGitHubCallback } from "../../../src/services/oauth.service";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { code, error } = req.query;

  if (error) {
    return res.redirect(`${process.env.FRONTEND_URL}/auth?error=oauth_error&message=${encodeURIComponent(error as string)}`);
  }

  if (typeof code !== 'string') {
    return res.redirect(`${process.env.FRONTEND_URL}/auth?error=oauth_error&message=No authorization code received`);
  }

  try {
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const { accessToken, refreshToken } = await handleGitHubCallback(code, ipAddress, userAgent);

    const frontendUrl = `${process.env.FRONTEND_URL}/auth/callback?` +
      `access_token=${accessToken}&refresh_token=${refreshToken}&expires_in=7200`;
    
    res.redirect(302, frontendUrl);
  } catch (err: any) {
    console.error('GitHub OAuth callback error:', err);
    res.redirect(`${process.env.FRONTEND_URL}/auth?error=oauth_error&message=${encodeURIComponent(err.message || 'Authentication failed')}`);
  }
} 