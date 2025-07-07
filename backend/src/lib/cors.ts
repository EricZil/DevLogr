import cors from 'cors';
import type { VercelRequest, VercelResponse } from "@vercel/node";

// Define allowed origins
const allowedOrigins = [
  'http://localhost:3000',
  'https://devlogr.space',
  process.env.FRONTEND_URL,
].filter(Boolean); // Remove any undefined values

// Initialize CORS middleware with options
const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if the origin is in our allowed list
    if (allowedOrigins.some(allowedOrigin => allowedOrigin && origin.startsWith(allowedOrigin))) {
      return callback(null, true);
    }
    
    // Allow all subdomains of devlogr.space
    if (origin.endsWith('.devlogr.space')) {
      return callback(null, true);
    }
    
    // Allow localhost and its subdomains
    if (origin.includes('localhost')) {
      return callback(null, true);
    }
    
    // Also allow any *.vercel.app domain for deployment previews
    if (origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    
    console.log('CORS: Blocked origin:', origin);
    // Block the request
    callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], // Allowed methods
  credentials: true, // Allow cookies to be sent
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'], // Allowed headers
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