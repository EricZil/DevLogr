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
      return callback(null, origin);
    }
    
    // Allow all subdomains of devlogr.space
    if (origin.endsWith('.devlogr.space')) {
      return callback(null, origin);
    }
    
    if (origin.includes('localhost')) {
      return callback(null, origin);
    }
    
    if (origin.endsWith('.vercel.app')) {
      return callback(null, origin);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
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
    // Make sure we add the Access-Control-Allow-Credentials header
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    // Ensure Access-Control-Allow-Origin is not '*' when credentials are included
    const origin = req.headers.origin;
    if (origin) {
      if (allowedOrigins.includes(origin) || 
          origin.endsWith('.devlogr.space') || 
          origin.includes('localhost') ||
          origin.endsWith('.vercel.app')) {
        res.setHeader('Access-Control-Allow-Origin', origin);
      }
    }
    
    // Handle preflight OPTIONS requests properly
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
      res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
      res.status(204).end();
      return;
    }
    
    await runMiddleware(req, res, corsMiddleware);
} 