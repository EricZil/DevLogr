import cors from 'cors';
import type { VercelRequest, VercelResponse } from "@vercel/node";

const allowedOrigins = [
  'http://localhost:3000',
  'https://devlogr.space',
  'https://api.devlogr.space',
  'https://www.devlogr.space',
  process.env.FRONTEND_URL,
].filter(Boolean);

const corsMiddleware = cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.some(allowedOrigin => allowedOrigin && origin.startsWith(allowedOrigin))) {
      return callback(null, origin);
    }
    
    if (origin.endsWith('.devlogr.space')) {
      return callback(null, origin);
    }
    
    if (origin === 'https://devlogr.space' || origin === 'http://devlogr.space') {
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

export async function applyCors(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    const origin = req.headers.origin;
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      console.log('CORS: Set Access-Control-Allow-Origin to:', origin);
    }
    
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
      res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
      res.status(204).end();
      return;
    }
    
    await runMiddleware(req, res, corsMiddleware);
} 