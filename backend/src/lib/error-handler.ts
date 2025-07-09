import { Prisma } from '@prisma/client';
import { PrismaClient } from '@prisma/client/edge';

// Custom error class for application-specific errors
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: any;

  constructor(message: string, statusCode: number, code: string, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
    
    this.name = 'AppError';
  }
}

export interface ErrorResponse {
  error: string;
  message: string;
  code?: string;
  details?: any;
  timestamp: string;
  requestId: string;
}

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get error title based on status code
 */
function getErrorTitle(statusCode: number): string {
  switch (statusCode) {
    case 400: return 'Bad Request';
    case 401: return 'Unauthorized';
    case 403: return 'Forbidden';
    case 404: return 'Not Found';
    case 409: return 'Conflict';
    case 422: return 'Unprocessable Entity';
    case 429: return 'Too Many Requests';
    case 500: return 'Internal Server Error';
    case 502: return 'Bad Gateway';
    case 503: return 'Service Unavailable';
    case 504: return 'Gateway Timeout';
    default: return 'Error';
  }
}

/**
 * Handle Prisma database errors
 */
function handlePrismaError(err: Prisma.PrismaClientKnownRequestError): {
  code: string;
  statusCode: number;
  message: string;
} {
  switch (err.code) {
    case 'P2002':
      // Unique constraint failed
      const target = err.meta?.target as string[] || [];
      const field = target[0] || 'field';
      return {
        code: 'UNIQUE_CONSTRAINT_VIOLATION',
        statusCode: 409,
        message: `The ${field} is already in use`
      };
    
    case 'P2014':
      // Required relation violation
      return {
        code: 'INVALID_RELATION',
        statusCode: 400,
        message: 'Invalid relation data provided'
      };
    
    case 'P2003':
      // Foreign key constraint failed
      return {
        code: 'FOREIGN_KEY_CONSTRAINT',
        statusCode: 400,
        message: 'Referenced record does not exist'
      };
    
    case 'P2025':
      // Record not found
      return {
        code: 'RECORD_NOT_FOUND',
        statusCode: 404,
        message: 'Record not found'
      };
    
    case 'P2021':
      // Table does not exist
      return {
        code: 'TABLE_NOT_FOUND',
        statusCode: 500,
        message: 'Database schema error'
      };
    
    case 'P2022':
      // Column does not exist
      return {
        code: 'COLUMN_NOT_FOUND',
        statusCode: 500,
        message: 'Database schema error'
      };
    
    default:
      return {
        code: 'DATABASE_ERROR',
        statusCode: 500,
        message: 'A database error occurred'
      };
  }
}

/**
 * Handle and format errors for API responses
 */
export function handleError(err: Error, requestId?: string): { statusCode: number; response: ErrorResponse } {
  // Generate unique request ID for tracking
  const id = requestId || generateRequestId();

  // Log the full error for debugging
  console.error(`❌ Error for request ${id}:`, {
    message: err.message,
    name: err.name,
    stack: process.env.NODE_ENV !== 'production' ? err.stack : 'Stack trace hidden in production',
    // Spread AppError properties if they exist
    ...('statusCode' in err && { statusCode: err.statusCode }),
    ...('code' in err && { code: err.code }),
    ...('details' in err && { details: err.details }),
  });

  let statusCode = 500;
  let errorResponse: ErrorResponse = {
    error: 'Internal Server Error',
    message: 'An unexpected error occurred.',
    timestamp: new Date().toISOString(),
    requestId: id,
  };

  // 1. Handle our custom AppError
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    errorResponse.error = getErrorTitle(statusCode);
    errorResponse.message = err.message;
    errorResponse.code = err.code;
    errorResponse.details = err.details;
  }
  // 2. Handle Prisma Known Errors
  else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const { code, statusCode: prismaStatusCode, message } = handlePrismaError(err);
    errorResponse.error = 'Database Error';
    errorResponse.message = message;
    errorResponse.code = code;
    statusCode = prismaStatusCode;
  } 
  // 3. Handle other Prisma errors
  else if (err instanceof Prisma.PrismaClientUnknownRequestError) {
    statusCode = 500;
    errorResponse.error = 'Database Error';
    errorResponse.message = 'An unknown database error occurred.';
    errorResponse.code = 'DATABASE_UNKNOWN_ERROR';
  }
  else if (err instanceof Prisma.PrismaClientRustPanicError) {
    statusCode = 500;
    errorResponse.error = 'Database Engine Error';
    errorResponse.message = 'The underlying database engine has crashed.';
    errorResponse.code = 'DATABASE_ENGINE_ERROR';
  }
  else if (err instanceof Prisma.PrismaClientInitializationError) {
    statusCode = 503;
    errorResponse.error = 'Service Unavailable';
    errorResponse.message = 'Could not connect to the database.';
    errorResponse.code = 'DATABASE_CONNECTION_ERROR';
  }
  else if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    errorResponse.error = 'Validation Error';
    errorResponse.message = 'A database validation error occurred. Check your input data.';
    errorResponse.code = 'PRISMA_VALIDATION_ERROR';
  }
  // 4. Handle JWT Errors
  else if (err.name === 'JsonWebTokenError' || err.name === 'NotBeforeError') {
    statusCode = 401;
    errorResponse.error = 'Authentication Error';
    errorResponse.message = 'The provided authentication token is invalid.';
    errorResponse.code = 'INVALID_TOKEN';
  }
  else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    errorResponse.error = 'Authentication Error';
    errorResponse.message = 'The provided authentication token has expired.';
    errorResponse.code = 'TOKEN_EXPIRED';
  }

  // In production, for any 5xx error, hide sensitive details
  if (process.env.NODE_ENV === 'production' && statusCode >= 500) {
    errorResponse.message = 'An internal server error occurred. Please try again later.';
    errorResponse.code = 'INTERNAL_ERROR';
    delete errorResponse.details;
  }

  return { statusCode, response: errorResponse };
}