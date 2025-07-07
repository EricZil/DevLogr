import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleGitHubCallback, handleGoogleCallback } from "../src/services/oauth.service";
import { AppError } from "../src/lib/error-handler";
import crypto from 'crypto';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { provider, action } = req.query;

    if (!provider || !action) {
      return res.status(400).json({ error: "Provider and action are required" });
    }

    switch (`${provider}-${action}`) {
      case 'github-auth':
        return handleGitHubAuth(req, res);
      
      case 'github-callback':
        return await handleGitHubCallbackWrapper(req, res);
      
      case 'google-auth':
        return handleGoogleAuth(req, res);
      
      case 'google-callback':
        return await handleGoogleCallbackWrapper(req, res);
      
      default:
        return res.status(404).json({ error: "OAuth provider/action not found" });
    }

  } catch (error: any) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error("OAuth Error:", error);
    return res.status(500).json({ error: "gj server gg (internal err)" });
  }
}

function handleGitHubAuth(req: VercelRequest, res: VercelResponse) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    throw new AppError('GitHub OAuth not configured', 500, 'OAUTH_NOT_CONFIGURED');
  }
  
  const state = crypto.randomBytes(32).toString('hex');
  const redirectUri = `${process.env.API_URL}/api/oauth?provider=github&action=callback`;
  
  const githubAuthUrl = 'https://github.com/login/oauth/authorize?' + 
    `client_id=${clientId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${encodeURIComponent('user:email')}` +
    `&state=${state}`;

  res.redirect(302, githubAuthUrl);
}

async function handleGitHubCallbackWrapper(req: VercelRequest, res: VercelResponse) {
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

function handleGoogleAuth(req: VercelRequest, res: VercelResponse) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new AppError('Google OAuth not configured', 500, 'OAUTH_NOT_CONFIGURED');
  }
  
  const state = crypto.randomBytes(32).toString('hex');
  const redirectUri = `${process.env.API_URL}/api/oauth?provider=google&action=callback`;
  
  const googleAuthUrl = 'https://accounts.google.com/o/oauth2/v2/auth?' + 
    `client_id=${clientId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent('openid email profile')}` +
    `&state=${state}`;

  res.redirect(302, googleAuthUrl);
}

async function handleGoogleCallbackWrapper(req: VercelRequest, res: VercelResponse) {
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
    const { accessToken, refreshToken } = await handleGoogleCallback(code, ipAddress, userAgent);

    const frontendUrl = `${process.env.FRONTEND_URL}/auth/callback?` +
      `access_token=${accessToken}&refresh_token=${refreshToken}&expires_in=7200`;
    
    res.redirect(302, frontendUrl);
  } catch (err: any) {
    console.error('Google OAuth callback error:', err);
    res.redirect(`${process.env.FRONTEND_URL}/auth?error=oauth_error&message=${encodeURIComponent(err.message || 'Authentication failed')}`);
  }
} 