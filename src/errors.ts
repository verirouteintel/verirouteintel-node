import type { ErrorCode, VeriRouteErrorDetails } from './types';

/**
 * Base error class for VeriRoute SDK errors
 */
export class VeriRouteError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode?: number;
  public readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    code: ErrorCode,
    statusCode?: number,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'VeriRouteError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;

    // Maintains proper stack trace in V8 environments
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, VeriRouteError);
    }
  }

  static fromResponse(statusCode: number, body: { error?: VeriRouteErrorDetails }): VeriRouteError {
    const error = body.error;

    if (error) {
      return new VeriRouteError(
        error.message,
        error.code as ErrorCode,
        statusCode,
        error.details
      );
    }

    // Fallback for unexpected error formats
    return new VeriRouteError(
      `Request failed with status ${statusCode}`,
      'SERVER_ERROR',
      statusCode
    );
  }
}

/**
 * Thrown when authentication fails
 */
export class AuthenticationError extends VeriRouteError {
  constructor(message = 'Invalid or missing API key') {
    super(message, 'AUTH_FAILED', 401);
    this.name = 'AuthenticationError';
  }
}

/**
 * Thrown when rate limit is exceeded
 */
export class RateLimitError extends VeriRouteError {
  public readonly retryAfter?: number;

  constructor(message = 'Rate limit exceeded', retryAfter?: number) {
    super(message, 'RATE_LIMIT_EXCEEDED', 429);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

/**
 * Thrown when account has insufficient balance
 */
export class InsufficientBalanceError extends VeriRouteError {
  constructor(message = 'Insufficient account balance') {
    super(message, 'INSUFFICIENT_BALANCE', 402);
    this.name = 'InsufficientBalanceError';
  }
}

/**
 * Thrown when phone number is invalid
 */
export class InvalidPhoneError extends VeriRouteError {
  public readonly phoneNumber?: string;

  constructor(message = 'Invalid phone number', phoneNumber?: string) {
    super(message, 'INVALID_PHONE_NUMBER', 400, { phoneNumber });
    this.name = 'InvalidPhoneError';
    this.phoneNumber = phoneNumber;
  }
}

/**
 * Thrown when attempting to look up international (non-NANP) numbers
 */
export class InternationalNotSupportedError extends VeriRouteError {
  public readonly phoneNumber?: string;
  public readonly detectedCountryCode?: number;

  constructor(
    message = 'International numbers are not supported. Only North American (NANP) numbers are accepted.',
    phoneNumber?: string,
    detectedCountryCode?: number
  ) {
    super(message, 'INTERNATIONAL_NOT_SUPPORTED', 400, {
      phoneNumber,
      detectedCountryCode,
      supportedCountryCodes: [1],
    });
    this.name = 'InternationalNotSupportedError';
    this.phoneNumber = phoneNumber;
    this.detectedCountryCode = detectedCountryCode;
  }
}

/**
 * Thrown when a request times out
 */
export class TimeoutError extends VeriRouteError {
  constructor(message = 'Request timed out') {
    super(message, 'TIMEOUT');
    this.name = 'TimeoutError';
  }
}

/**
 * Thrown when a network error occurs
 */
export class NetworkError extends VeriRouteError {
  constructor(message = 'Network error occurred') {
    super(message, 'NETWORK_ERROR');
    this.name = 'NetworkError';
  }
}
