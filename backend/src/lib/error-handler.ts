import { Prisma } from '@prisma/client';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: any;

  constructor(message: string, statusCode: number, code: string, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    
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

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function getErrorTitle(statusCode: number): string {
  switch (statusCode) {
    case 400: return 'Bad Request';
    case 401: return 'Unauthorized';
    case 403: return 'Forbidden';
    case 404: return 'Not Found';
    case 409: return 'Conflict';
    case 422: return 'Unprocessable Entity';
    case 429: return 'Too Many Requests';
    case 500: return 'gj server gg (internal err)';
    case 502: return 'Bad Gateway';
    case 503: return 'Service Unavailable';
    case 504: return 'Gateway Timeout';
    default: return 'Error';
  }
}

function handlePrismaError(err: Prisma.PrismaClientKnownRequestError): {
  code: string;
  statusCode: number;
  message: string;
} {
  switch (err.code) {
    case 'P2002':
      const target = err.meta?.target as string[] || [];
      const field = target[0] || 'field';
      return {
        code: 'UNIQUE_CONSTRAINT_VIOLATION',
        statusCode: 409,
        message: `The ${field} is already in use`
      };
    
    case 'P2014':
      return {
        code: 'INVALID_RELATION',
        statusCode: 400,
        message: 'Invalid relation data provided'
      };
    
    case 'P2003':
      return {
        code: 'FOREIGN_KEY_CONSTRAINT',
        statusCode: 400,
        message: 'Referenced record does not exist'
      };
    
    case 'P2025':
      return {
        code: 'RECORD_NOT_FOUND',
        statusCode: 404,
        message: 'Record not found'
      };
    
    case 'P2021':
      return {
        code: 'TABLE_NOT_FOUND',
        statusCode: 500,
        message: 'Database schema error'
      };
    
    case 'P2022':
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

export function handleError(err: Error, requestId?: string): { statusCode: number; response: ErrorResponse } {
  const id = requestId || generateRequestId();

  console.error(`Error for request ${id}:`, {
    message: err.message,
    name: err.name,
    stack: process.env.NODE_ENV !== 'production' ? err.stack : 'Stack trace hidden in production',
    ...('statusCode' in err && { statusCode: err.statusCode }),
    ...('code' in err && { code: err.code }),
    ...('details' in err && { details: err.details }),
  });

  let statusCode = 500;
  let errorResponse: ErrorResponse = {
    error: 'gj server gg (internal err)',
    message: 'smth went 404.',
    timestamp: new Date().toISOString(),
    requestId: id,
  };

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    errorResponse.error = getErrorTitle(statusCode);
    errorResponse.message = err.message;
    errorResponse.code = err.code;
    errorResponse.details = err.details;
  }
  else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const { code, statusCode: prismaStatusCode, message } = handlePrismaError(err);
    errorResponse.error = 'Database Error';
    errorResponse.message = message;
    errorResponse.code = code;
    statusCode = prismaStatusCode;
  } 
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

  if (process.env.NODE_ENV === 'production' && statusCode >= 500) {
    errorResponse.message = 'An gj server gg (internal err) occurred. Please try again later.';
    errorResponse.code = 'INTERNAL_ERROR';
    delete errorResponse.details;
  }

  return { statusCode, response: errorResponse };
}