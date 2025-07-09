import { prisma } from "../lib/prisma";
import { AppError } from "../lib/error-handler";
import { generateTokens } from "../lib/auth";

interface GoogleTokenResponse { access_token: string; refresh_token?: string; }
interface GoogleUserResponse { id: string; email: string; name: string; picture: string; }
interface GitHubTokenResponse { access_token: string; refresh_token?: string; }
interface GitHubUserResponse { id: number; login: string; name: string | null; email: string | null; avatar_url: string; }
interface GitHubEmailResponse { email: string; primary: boolean; verified: boolean; }

export async function handleGoogleCallback(code: string, ipAddress?: string, userAgent?: string) {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id: process.env.GOOGLE_CLIENT_ID!,
            client_secret: process.env.GOOGLE_CLIENT_SECRET!,
            code,
            grant_type: 'authorization_code',
            redirect_uri: `${process.env.API_URL}/api/oauth?provider=google&action=callback`,
        }),
    });
    const tokens = await tokenResponse.json() as GoogleTokenResponse;
    if (!tokens.access_token) {
        throw new AppError("Failed to get Google access token", 500, "OAUTH_TOKEN_ERROR");
    }

    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const googleUser = await userResponse.json() as GoogleUserResponse;

    let user = await prisma.user.findUnique({ where: { email: googleUser.email } });

    if (user) {
        await prisma.userProvider.upsert({
            where: { provider_providerId: { provider: 'GOOGLE', providerId: googleUser.id } },
            update: { accessToken: tokens.access_token, refreshToken: tokens.refresh_token },
            create: { userId: user.id, provider: 'GOOGLE', providerId: googleUser.id, accessToken: tokens.access_token, refreshToken: tokens.refresh_token },
        });
    } else {
        user = await prisma.user.create({
            data: {
                email: googleUser.email,
                name: googleUser.name,
                avatar: googleUser.picture,
                status: 'ACTIVE',
                emailVerified: new Date(),
                providers: { create: { provider: 'GOOGLE', providerId: googleUser.id, accessToken: tokens.access_token, refreshToken: tokens.refresh_token } }
            },
        });
    }

    const { accessToken, refreshToken } = generateTokens(user.id);
    await prisma.session.create({
        data: { userId: user.id, token: accessToken, refreshToken, expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), ipAddress, userAgent }
    });
    await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date(), loginCount: { increment: 1 } }
    });

    return { accessToken, refreshToken };
}

export async function handleGitHubCallback(code: string, ipAddress?: string, userAgent?: string) {
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id: process.env.GITHUB_CLIENT_ID!,
            client_secret: process.env.GITHUB_CLIENT_SECRET!,
            code,
            redirect_uri: `${process.env.API_URL}/api/oauth?provider=github&action=callback`,
        }),
    });
    const tokens = await tokenResponse.json() as GitHubTokenResponse;
    if (!tokens.access_token) {
        throw new AppError("Failed to get GitHub access token", 500, "OAUTH_TOKEN_ERROR");
    }

    const userResponse = await fetch('https://api.github.com/user', { headers: { Authorization: `Bearer ${tokens.access_token}` } });
    const githubUser = await userResponse.json() as GitHubUserResponse;
    
    const emailResponse = await fetch('https://api.github.com/user/emails', { headers: { Authorization: `Bearer ${tokens.access_token}` } });
    const emails = await emailResponse.json() as GitHubEmailResponse[];
    const primaryEmail = emails.find(e => e.primary && e.verified)?.email || githubUser.email;
    if (!primaryEmail) {
        throw new AppError("No verified primary email found on GitHub account", 400, "NO_VERIFIED_EMAIL");
    }

    let user = await prisma.user.findUnique({ where: { email: primaryEmail } });

    if (user) {
        await prisma.user.update({
            where: { id: user.id },
            data: {
                avatar: githubUser.avatar_url,
                username: user.username || githubUser.login,
                name: user.name || githubUser.name || githubUser.login,
            }
        });

        await prisma.userProvider.upsert({
            where: { provider_providerId: { provider: 'GITHUB', providerId: githubUser.id.toString() } },
            update: { accessToken: tokens.access_token, refreshToken: tokens.refresh_token },
            create: { userId: user.id, provider: 'GITHUB', providerId: githubUser.id.toString(), accessToken: tokens.access_token, refreshToken: tokens.refresh_token },
        });
    } else {
        user = await prisma.user.create({
            data: {
                email: primaryEmail,
                name: githubUser.name || githubUser.login,
                username: githubUser.login,
                avatar: githubUser.avatar_url,
                status: 'ACTIVE',
                emailVerified: new Date(),
                providers: { create: { provider: 'GITHUB', providerId: githubUser.id.toString(), accessToken: tokens.access_token, refreshToken: tokens.refresh_token } }
            },
        });
    }

    const { accessToken, refreshToken } = generateTokens(user.id);
    await prisma.session.create({
        data: { userId: user.id, token: accessToken, refreshToken, expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), ipAddress, userAgent }
    });
    await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date(), loginCount: { increment: 1 } }
    });

    return { accessToken, refreshToken };
} 