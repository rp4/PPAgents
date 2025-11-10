/**
 * Centralized API Error Handling
 * Provides consistent error responses and logging across all API routes
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { logError } from '@/lib/security/logger';

export interface ApiErrorOptions {
  action: string;
  statusCode?: number;
  logContext?: Record<string, any>;
}

/**
 * Standardized API error handler
 * Handles Zod validation errors, generic errors, and logging
 */
export function handleApiError(
  error: unknown,
  options: ApiErrorOptions
): NextResponse {
  // Handle Zod validation errors
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      { error: 'Validation error', details: error.issues },
      { status: 400 }
    );
  }

  // Handle known error types with custom messages
  if (error instanceof Error) {
    // Handle specific error cases
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    if (error.message === 'Not found') {
      return NextResponse.json(
        { error: 'Resource not found' },
        { status: 404 }
      );
    }

    // Log the error with context
    logError(error, { action: options.action, ...options.logContext });

    return NextResponse.json(
      { error: error.message || `Failed to ${options.action}` },
      { status: options.statusCode || 500 }
    );
  }

  // Handle unknown errors
  logError(error, { action: options.action, ...options.logContext });
  return NextResponse.json(
    { error: `Failed to ${options.action}` },
    { status: options.statusCode || 500 }
  );
}

/**
 * Async error wrapper for API routes
 * Automatically catches and handles errors
 */
export function withErrorHandler<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>,
  options: ApiErrorOptions
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleApiError(error, options);
    }
  };
}
