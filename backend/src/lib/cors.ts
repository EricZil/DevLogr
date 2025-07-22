import cors from 'cors';
import type { VercelRequest, VercelResponse } from "@vercel/node";

// Define allowed origins
const allowedOrigins = [
  'http://localhost:3000',
  'https://devlogr.space',
  'https://api.devlogr.space',
  'https://www.devlogr.space',
  process.env.FRONTEND_URL,
].filter(Boolean); // Remove any undefined values

console.log('CORS: Allowed origins:', allowedOrigins);
console.log('CORS: FRONTEND_URL env var:', process.env.FRONTEND_URL);

// Initialize CORS middleware with options
const corsMiddleware = cors({
  origin: (origin, callback) => {
    console.log('CORS: Checking origin:', origin);
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      console.log('CORS: Allowing request with no origin');
      return callback(null, true);
    }
    
    // Temporarily allow all origins for debugging
    console.log('CORS: Allowing origin for debugging:', origin);
    return callback(null, origin);
    
    // Original logic (commented out for debugging)
    /*
    // Check if the origin is in our allowed list
    if (allowedOrigins.some(allowedOrigin => allowedOrigin && origin.startsWith(allowedOrigin))) {
      return callback(null, origin);
    }
    
    // Allow all subdomains of devlogr.space
    if (origin.endsWith('.devlogr.space')) {
      return callback(null, origin);
    }
    
    // Allow devlogr.space itself
    if (origin === 'https://devlogr.space' || origin === 'http://devlogr.space') {
      return callback(null, origin);
    }
    
    if (origin.includes('localhost')) {
      return callback(null, origin);
    }
    
    if (origin.endsWith('.vercel.app')) {
      return callback(null, origin);
    }
    
    // Log rejected origins for debugging
    console.log('CORS: Rejecting origin:', origin);
    callback(new Error('Not allowed by CORS'));
    */
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
    console.log('CORS: Manual header setting for origin:', origin);
    if (origin) {
      // Temporarily allow all origins for debugging
      res.setHeader('Access-Control-Allow-Origin', origin);
      console.log('CORS: Set Access-Control-Allow-Origin to:', origin);
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