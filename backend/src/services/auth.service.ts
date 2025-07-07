import { prisma } from "../lib/prisma";
import { AppError } from "../lib/error-handler";
import { z } from "zod";
import { generateTokens, hashPassword, verifyPassword } from "../lib/auth";
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const registerSchema = z.object({
    email: z.string().email("Please provide a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters long"),
    name: z.string().trim().min(2, "Name must be at least 2 characters"),
    username: z.string().trim().min(3, "Username must be at least 3 characters").optional(),
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1, "Password is required"),
});

export async function registerUser(userData: any, ipAddress?: string, userAgent?: string) {
    const { email, password, name, username } = registerSchema.parse(userData);

    const existingUser = await prisma.user.findFirst({ where: { OR: [{ email }, { username }] } });
    if (existingUser) {
        throw new AppError("User with this email or username already exists", 409, "USER_EXISTS");
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
        data: {
            email,
            password: hashedPassword,
            name,
            username,
            status: 'PENDING_VERIFICATION',
            emailVerifyToken: crypto.randomBytes(32).toString('hex'),
            emailVerifyExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hrs
        },
    });

    const { accessToken, refreshToken } = generateTokens(user.id);

    await prisma.session.create({
        data: {
            userId: user.id,
            token: accessToken,
            refreshToken,
            expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hrs
            ipAddress,
            userAgent,
        }
    });
    
    await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date(), loginCount: { increment: 1 } },
    });

    const { password: _, ...safeUser } = user;
    return { user: safeUser, accessToken, refreshToken };
}

export async function loginUser(credentials: any, ipAddress?: string, userAgent?: string) {
    const { email, password } = loginSchema.parse(credentials);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.password) {
        throw new AppError("Invalid credentials", 401, "INVALID_CREDENTIALS");
    }

    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
        throw new AppError("Invalid credentials", 401, "INVALID_CREDENTIALS");
    }

    if (user.status === 'SUSPENDED') {
        throw new AppError("Your account has been suspended", 403, "ACCOUNT_SUSPENDED");
    }

    const { accessToken, refreshToken } = generateTokens(user.id);
    
    await prisma.session.create({
        data: {
            userId: user.id,
            token: accessToken,
            refreshToken,
            expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
            ipAddress,
            userAgent,
        }
    });

    await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date(), loginCount: { increment: 1 } },
    });

    const { password: _, ...safeUser } = user;
    return { user: safeUser, accessToken, refreshToken };
}

export async function logoutUser(accessToken: string) {
    if (accessToken) {
        await prisma.session.deleteMany({ where: { token: accessToken } });
    }
    return { message: "Logout successful" };
}

export async function refreshUserToken(token: string) {
    if (!token) {
        throw new AppError("Refresh token is required", 401, "MISSING_REFRESH_TOKEN");
    }
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET as string) as any;
    if (decoded.type !== 'refresh') {
        throw new AppError("Invalid token type", 401, "INVALID_TOKEN_TYPE");
    }
    const session = await prisma.session.findFirst({
        where: { userId: decoded.userId, refreshToken: token, expiresAt: { gt: new Date() } }
    });
    if (!session) {
        throw new AppError("Refresh token is dead", 403, "INVALID_REFRESH_TOKEN");
    }
    const { accessToken, refreshToken } = generateTokens(decoded.userId);
    await prisma.session.update({
        where: { id: session.id },
        data: { token: accessToken, refreshToken, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
    });
    return { accessToken, refreshToken };
}

export async function getMe(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, name: true, username: true, role: true, status: true }
    });
    if (!user) {
        throw new AppError("User not found", 404, "USER_NOT_FOUND");
    }
    return user;
} 