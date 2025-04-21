import { AuthError } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { apiError, ApiErrorCode } from '@/lib/api/response'

/**
 * Common error codes and their user-friendly messages
 */
const ERROR_MESSAGES: Record<string, string> = {
  'auth/invalid-email': 'Please enter a valid email address',
  'auth/user-disabled': 'This account has been disabled',
  'auth/user-not-found': 'No account found with this email',
  'auth/wrong-password': 'Incorrect password',
  'auth/email-already-in-use': 'An account already exists with this email',
  'auth/operation-not-allowed': 'This operation is not allowed',
  'auth/weak-password': 'Please choose a stronger password',
  'auth/invalid-action-code': 'This action code is invalid or has expired',
  'auth/expired-action-code': 'This action code has expired',
  'auth/invalid-verification-code': 'Invalid verification code',
  'auth/invalid-verification-id': 'Invalid verification ID',
  'auth/missing-verification-code': 'Please enter the verification code',
  'auth/missing-verification-id': 'Missing verification ID',
  'auth/credential-already-in-use': 'This credential is already associated with a different user account',
  'auth/invalid-credential': 'The provided credential is invalid',
  'auth/invalid-verification': 'Invalid verification',
  'auth/invalid-email-verified': 'Email verification is invalid',
  'auth/missing-password': 'Please enter a password',
  'auth/missing-email': 'Please enter an email address',
  'auth/email-not-verified': 'Please verify your email address',
  'auth/network-request-failed': 'A network error occurred. Please check your connection',
  'auth/too-many-requests': 'Too many unsuccessful attempts. Please try again later',
  'auth/popup-closed-by-user': 'The popup was closed before completing the sign in process',
}

/**
 * Type for authentication error responses
 */
export interface AuthErrorResponse {
  code: string
  message: string
  details?: Record<string, any>
}

/**
 * Formats an authentication error into a user-friendly message
 */
export function formatAuthError(error: AuthError | Error | unknown): string {
  if (!error) return 'An unknown error occurred'

  // Handle Supabase AuthError
  if (error instanceof AuthError) {
    const code = error.status || error.name
    return ERROR_MESSAGES[code] || error.message || 'An authentication error occurred'
  }

  // Handle standard Error
  if (error instanceof Error) {
    const errorCode = (error as any).code
    return ERROR_MESSAGES[errorCode] || error.message || 'An error occurred'
  }

  // Handle string errors
  if (typeof error === 'string') {
    return ERROR_MESSAGES[error] || error
  }

  return 'An unknown error occurred'
}

/**
 * Checks if an error is a network error
 */
export function isNetworkError(error: Error | unknown): boolean {
  if (!error) return false

  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    return (
      message.includes('network') ||
      message.includes('connection') ||
      message.includes('offline') ||
      message.includes('failed to fetch')
    )
  }

  return false
}

/**
 * Checks if an error is due to an expired session
 */
export function isSessionExpiredError(error: Error | unknown): boolean {
  if (!error) return false

  if (error instanceof AuthError) {
    return error.status === 401 || error.message.includes('expired')
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    return message.includes('expired') || message.includes('invalid session')
  }

  return false
}

/**
 * Handles common authentication errors
 */
export function handleAuthError(error: Error | unknown): AuthErrorResponse {
  const message = formatAuthError(error)
  
  // Network errors
  if (isNetworkError(error)) {
    return {
      code: 'network_error',
      message,
      details: { type: 'network' }
    }
  }
  
  // Session expired
  if (isSessionExpiredError(error)) {
    return {
      code: 'session_expired',
      message: 'Your session has expired. Please log in again.',
      details: { type: 'session' }
    }
  }
  
  // Generic auth error
  return {
    code: 'auth_error',
    message,
    details: { type: 'auth' }
  }
}

// Type guard for Supabase AuthError
function isAuthError(error: unknown): error is AuthError {
  return typeof error === 'object' && error !== null && 'status' in error;
}

// Map Supabase Auth errors to API error responses
export function handleSupabaseAuthError(error: unknown): NextResponse {
  console.error('Supabase Auth Error:', error);
  
  if (isAuthError(error)) {
    switch (error.status) {
      case 400:
        return apiError(error.message, 'BAD_REQUEST', 400);
      case 401:
        return apiError(error.message, 'UNAUTHORIZED', 401);
      case 403:
        return apiError(error.message, 'FORBIDDEN', 403);
      case 404:
        return apiError(error.message, 'NOT_FOUND', 404);
      default:
        return apiError(error.message, 'INTERNAL_ERROR', 500);
    }
  } 
  
  // Default error if it's not a recognized AuthError
  return apiError('An unexpected authentication error occurred', 'INTERNAL_ERROR', 500);
}

// Map general errors to API error responses
export function handleGeneralError(error: unknown, defaultMessage: string = 'An unexpected error occurred'): NextResponse {
  console.error('General Error:', error);
  
  if (error instanceof Error) {
    // You could add more specific error handling here based on error.name
    return apiError(error.message, 'INTERNAL_ERROR', 500);
  }
  
  return apiError(defaultMessage, 'INTERNAL_ERROR', 500);
}

// Example of a more specific error handler (if needed)
// export function handleDatabaseError(error: unknown): NextResponse {
//   console.error('Database Error:', error);
//   if (isPostgrestError(error)) { // Need to define isPostgrestError type guard
//     // Handle specific PostgREST errors
//     return apiError(error.message, 'DATABASE_ERROR', 500, error.details);
//   }
//   return apiError('A database error occurred', 'DATABASE_ERROR', 500);
// } 