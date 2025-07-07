import jwt from 'jsonwebtoken';
import { AppError } from './error-handler';
import bcrypt from 'bcryptjs';
import type { VercelRequest } from "@vercel/node";

interface JwtPayload {
    userId: string;
    type: 'access' | 'refresh';
}

function getJwtToken(request: VercelRequest): string | null {
  const authHeader = request.headers.authorization;
  return authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
}

function validateJwtToken(token: string): JwtPayload {
  try {
    const decoded = jwt.verify(
      token,
      process.env.NEXTAUTH_SECRET as string
    ) as JwtPayload;

    if (decoded.type !== "access") {
      throw new AppError(
        'Invalid token type. Expected "access" token.',
        401,
        "INVALID_TOKEN_TYPE"
      );
    }

    if (!decoded.userId) {
      throw new AppError(
        "User identifier not found in token.",
        401,
        "INVALID_TOKEN_PAYLOAD"
      );
    }

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AppError("Access token has expired.", 401, "TOKEN_EXPIRED");
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AppError(
        `Invalid access token: ${error.message}`,
        401,
        "INVALID_ACCESS_TOKEN"
      );
    }
    throw error;
  }
}

export function getUserIdFromToken(request: VercelRequest): string {
  const token = getJwtToken(request);
  if (!token) {
    throw new AppError("Access token is required", 401, "MISSING_ACCESS_TOKEN");
  }
  const payload = validateJwtToken(token);
  return payload.userId;
}

export const generateTokens = (userId: string) => {
  const accessToken = jwt.sign(
    { userId, type: 'access' },
    process.env.NEXTAUTH_SECRET as string,
    { expiresIn: '2h' }
  );

  const refreshToken = jwt.sign(
    { userId, type: 'refresh' },
    process.env.NEXTAUTH_SECRET as string,
    { expiresIn: '30d' }
  );

  return { accessToken, refreshToken };
};

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

export const verifyPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
}; 