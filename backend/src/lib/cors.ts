import cors from 'cors';
import type { VercelRequest, VercelResponse } from "@vercel/node";

// Initialize CORS middleware with options
const corsMiddleware = cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000', // Allow requests from the frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], // Allowed methods
  credentials: true, // Allow cookies to be sent
  allowedHeaders: ['Content-Type', 'Authorization'], // Allowed headers
});

/**
 * Helper function to run middleware in a Vercel Function.
 * This promisifies the middleware so it can be awaited.
 */
function runMiddleware(
  req: VercelRequest,
  res: VercelResponse,
  fn: Function
) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

/**
 * A wrapper function to apply CORS to a Vercel API handler.
 * It runs the CORS middleware before executing the actual handler.
 */
export async function applyCors(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
    await runMiddleware(req, res, corsMiddleware);
} 