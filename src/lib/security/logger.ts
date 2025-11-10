/**
 * Secure Logging Utilities
 * Implements structured logging with PII redaction
 */

import winston from 'winston';

/**
 * Fields that should be redacted from logs
 */
const SENSITIVE_FIELDS = new Set([
  'password',
  'token',
  'secret',
  'apiKey',
  'api_key',
  'accessToken',
  'access_token',
  'refreshToken',
  'refresh_token',
  'sessionToken',
  'session_token',
  'authorization',
  'cookie',
  'credit_card',
  'creditCard',
  'ssn',
  'social_security',
]);

/**
 * Redact sensitive information from objects
 */
function redactSensitiveData(obj: any, depth = 0): any {
  if (depth > 10) return '[Max Depth Reached]';

  if (obj === null || obj === undefined) return obj;

  if (typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(item => redactSensitiveData(item, depth + 1));
  }

  const redacted: any = {};

  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();

    if (SENSITIVE_FIELDS.has(lowerKey) || lowerKey.includes('password') || lowerKey.includes('secret')) {
      redacted[key] = '[REDACTED]';
    } else if (typeof value === 'object') {
      redacted[key] = redactSensitiveData(value, depth + 1);
    } else {
      redacted[key] = value;
    }
  }

  return redacted;
}

/**
 * Redact PII (Personally Identifiable Information)
 * Partially masks emails and IDs
 */
export function redactPII(value: string | null | undefined): string {
  if (!value) return '[EMPTY]';

  // Redact email addresses (keep first 2 chars and domain)
  if (value.includes('@')) {
    const [local, domain] = value.split('@');
    if (local.length <= 2) return `${local}@${domain}`;
    return `${local.substring(0, 2)}***@${domain}`;
  }

  // Redact UUIDs (keep first 8 chars)
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
    return `${value.substring(0, 8)}-****-****-****-************`;
  }

  // Redact long strings (keep first 4 and last 4)
  if (value.length > 12) {
    return `${value.substring(0, 4)}***${value.substring(value.length - 4)}`;
  }

  return '***';
}

/**
 * Create Winston logger instance
 */
const createLogger = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const isDevelopment = process.env.NODE_ENV === 'development';

  return winston.createLogger({
    level: isProduction ? 'info' : 'debug',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json(),
      winston.format((info) => {
        // Redact sensitive data from all log entries
        return redactSensitiveData(info);
      })()
    ),
    defaultMeta: {
      service: 'ppagents',
      environment: process.env.NODE_ENV,
    },
    transports: [
      // Console transport
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(({ level, message, timestamp, ...meta }) => {
            const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
            return `${timestamp} [${level}]: ${message} ${metaStr}`;
          })
        ),
        // In production, only log errors to console
        level: isProduction ? 'error' : 'debug',
      }),
    ],
    // Don't exit on uncaught exceptions
    exitOnError: false,
  });
};

// Export singleton logger instance
export const logger = createLogger();

/**
 * Log user action with automatic PII redaction
 */
export function logUserAction(
  userId: string | undefined,
  action: string,
  metadata?: Record<string, any>
) {
  logger.info('User action', {
    userId: userId ? redactPII(userId) : 'anonymous',
    action,
    ...redactSensitiveData(metadata || {}),
  });
}

/**
 * Log API request
 */
export function logAPIRequest(
  method: string,
  path: string,
  userId?: string,
  metadata?: Record<string, any>
) {
  logger.debug('API request', {
    method,
    path,
    userId: userId ? redactPII(userId) : 'anonymous',
    ...redactSensitiveData(metadata || {}),
  });
}

/**
 * Log security event
 */
export function logSecurityEvent(
  event: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  metadata?: Record<string, any>
) {
  logger.warn('Security event', {
    event,
    severity,
    ...redactSensitiveData(metadata || {}),
  });
}

/**
 * Log error with context
 */
export function logError(
  error: Error | unknown,
  context?: Record<string, any>
) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  logger.error('Error occurred', {
    error: errorMessage,
    stack: errorStack,
    ...redactSensitiveData(context || {}),
  });
}

// Export for backward compatibility
export default logger;
