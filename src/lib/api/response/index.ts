import { NextResponse } from 'next/server'

export type ApiErrorCode = 
  | 'INTERNAL_ERROR' 
  | 'DATABASE_ERROR' 
  | 'VALIDATION_ERROR' 
  | 'NOT_FOUND' 
  | 'UNAUTHORIZED' 
  | 'FORBIDDEN' 
  | 'BAD_REQUEST'
  | 'UNKNOWN_ERROR'
  | 'UPLOAD_ERROR'
  | 'STORAGE_ERROR'
  | 'MISSING_PARAMETER'
  // Add specific codes as needed

export interface ApiErrorResponse {
  success: false;
  error: {
    code: ApiErrorCode;
    message: string;
    details?: unknown;
  };
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>; // Use unknown for meta values
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Creates a successful API response with standardized format
 */
export function apiSuccess<T>(data: T, meta?: Record<string, unknown>, options?: ResponseInit): NextResponse<ApiSuccessResponse<T>> {
  const response: ApiSuccessResponse<T> = {
    success: true,
    data,
    ...(meta && { meta }),
  };
  return NextResponse.json(response, { status: 200, ...options });
}

/**
 * Creates an error API response with standardized format
 */
export function apiError(
  message: string,
  code: ApiErrorCode = 'UNKNOWN_ERROR',
  status: number = 500,
  details?: unknown,
  options?: ResponseInit
): NextResponse<ApiErrorResponse> {
  const errorPayload: ApiErrorResponse['error'] = { code, message };
  if (details !== undefined) {
    errorPayload.details = details;
  }
  const response: ApiErrorResponse = {
    success: false,
    error: errorPayload,
  };
  return NextResponse.json(response, { status, ...options });
}

/**
 * Common API error responses
 */
export const ApiErrors = {
  // Auth errors
  unauthorized: (message = 'Unauthorized', details?: unknown) => 
    apiError(message, 'UNAUTHORIZED', 401, details),
  
  forbidden: (message = 'Forbidden', details?: unknown) => 
    apiError(message, 'FORBIDDEN', 403, details),
  
  // Input validation errors
  badRequest: (message = 'Bad request', details?: unknown) => 
    apiError(message, 'BAD_REQUEST', 400, details),
  
  validationError: (message = 'Validation failed', details?: unknown) => 
    apiError(message, 'VALIDATION_ERROR', 400, details),
  
  // Resource errors
  notFound: (message = 'Resource not found', details?: unknown) => 
    apiError(message, 'NOT_FOUND', 404, details),
  
  internalError: (message = 'Internal server error', details?: unknown) => 
    apiError(message, 'INTERNAL_ERROR', 500, details),
  
  databaseError: (message = 'Database error', details?: unknown) =>
    apiError(message, 'DATABASE_ERROR', 500, details),
  
  // Add more specific errors as needed
};

/**
 * Helper to handle async API routes with proper error handling
 */
export async function withErrorHandling<T = unknown>(
  handler: () => Promise<NextResponse<ApiResponse<T>>>
): Promise<NextResponse<ApiResponse<T>>> {
  try {
    return await handler();
  } catch (error: unknown) { 
    console.error('[API Error Handler] Caught unhandled exception:', error);
    
    let message = 'An unexpected error occurred';
    let code: ApiErrorCode = 'INTERNAL_ERROR';
    let status = 500;
    let details: unknown = undefined;
    
    if (error instanceof Error) {
      message = error.message;
      // Map specific error types to codes/statuses
      if (error.name === 'ValidationError') { code = 'VALIDATION_ERROR'; status = 400; }
      else if (error.name === 'DatabaseError') { code = 'DATABASE_ERROR'; status = 500; }
      else if (error.name === 'AuthorizationError') { code = 'UNAUTHORIZED'; status = 401; }
      else if (error.name === 'ForbiddenError') { code = 'FORBIDDEN'; status = 403; }
      else if (error.name === 'NotFoundError') { code = 'NOT_FOUND'; status = 404; }
      // Add more mappings if needed
      
      // Try to get details if available
      if ('details' in error) {
          details = (error as ValidationError | DatabaseError).details;
      }
    } else if (typeof error === 'object' && error !== null) {
        // Capture non-Error object details
        details = error; 
    }

    return apiError(message, code, status, details);
  }
}

// Custom Error Classes (optional but recommended for specific error mapping)
export class ValidationError extends Error {
  constructor(message: string, public details?: unknown) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class DatabaseError extends Error {
  constructor(message: string, public details?: unknown) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class AuthorizationError extends Error {
  constructor(message: string = 'Unauthorized') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class ForbiddenError extends Error {
  constructor(message: string = 'Forbidden') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
  }
} 