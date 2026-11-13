/**
 * Error handling utilities for Planka API operations
 */

import { IExecuteFunctions, NodeApiError, NodeOperationError } from 'n8n-workflow';
import { withDetail } from './requestExecution';

/**
 * Standard error codes used by the Planka API
 */
export enum APIErrorCode {
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  METHOD_NOT_ALLOWED = 405,
  NOT_ACCEPTABLE = 406,
  TIMEOUT = 408,
  CONFLICT = 409,
  GONE = 410,
  PAYLOAD_TOO_LARGE = 413,
  URI_TOO_LONG = 414,
  UNSUPPORTED_MEDIA_TYPE = 415,
  UNPROCESSABLE_ENTITY = 422,
  TOO_MANY_REQUESTS = 429,
  INTERNAL_SERVER_ERROR = 500,
  NOT_IMPLEMENTED = 501,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503,
  GATEWAY_TIMEOUT = 504,
}

/**
 * Checks if an error has a specific status code
 *
 * @param error - The error object to check
 * @param statusCode - The expected status code
 * @returns True if the error has the specified status code
 */
export function hasStatusCode(error: any, statusCode: number): boolean {
  return error?.statusCode === statusCode || error?.response?.statusCode === statusCode;
}

/**
 * Extracts a human-readable error message from an error object
 *
 * @param error - The error object
 * @returns A formatted error message string
 */
export function getErrorMessage(error: any): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  // Try various common error message locations
  if (error?.response?.body?.error) {
    return error.response.body.error;
  }

  if (error?.response?.body?.message) {
    return error.response.body.message;
  }

  if (error?.response?.body?.detail) {
    return error.response.body.detail;
  }

  if (error?.response?.message) {
    return error.response.message;
  }

  if (error?.message) {
    return error.message;
  }

  if (error?.error) {
    return error.error;
  }

  return 'An unknown error occurred';
}

/**
 * Extracts validation errors from an error response
 *
 * @param error - The error object
 * @returns Array of validation errors or undefined
 */
export function getValidationErrors(error: any): Array<{ field: string; message: string }> | undefined {
  if (error?.response?.body?.validation_errors) {
    return error.response.body.validation_errors;
  }

  if (error?.response?.body?.errors) {
    return error.response.body.errors;
  }

  if (error?.validation_errors) {
    return error.validation_errors;
  }

  if (error?.errors) {
    return error.errors;
  }

  return undefined;
}

/**
 * Extracts the status code from an error object
 *
 * @param error - The error object
 * @returns The status code or undefined if not found
 */
export function getStatusCode(error: any): number | undefined {
  return error?.statusCode || error?.response?.statusCode;
}

/**
 * Creates a standardized NodeApiError with detailed information
 *
 * @param context - The execution context
 * @param error - The original error
 * @param message - Custom error message
 * @param description - Detailed error description
 * @returns A NodeApiError with standardized formatting
 */
export function createApiError(
  context: IExecuteFunctions,
  error: any,
  message: string,
  description: string,
): NodeApiError {
  // The single chokepoint: all 13 status branches in handleAPIError() route
  // through here, and this is the only `new NodeApiError` in the file. Enriching
  // `message` HERE covers every branch — editing the 13 call sites individually
  // is how a 14th gets forgotten.
  //
  // Why `message` and not `description`: n8n serialises only `.message` into a
  // continueOnFail item and onto the canvas badge (verified in the deployed
  // n8n 2.18.7 dist). A 422 that reported "Validation error" while Planka had
  // actually said "Must not have boards" hid a six-month project leak.
  return new NodeApiError(context.getNode(), error, {
    message: withDetail(message, error),
    description,
  });
}

/**
 * Creates a standardized NodeOperationError
 *
 * @param context - The execution context
 * @param message - Error message
 * @returns A NodeOperationError with standardized formatting
 */
export function createOperationError(
  context: IExecuteFunctions,
  message: string,
): NodeOperationError {
  return new NodeOperationError(context.getNode(), message);
}

/**
 * Handles common API error scenarios and throws appropriate errors
 *
 * Handles the following status codes with specific messages:
 * - 400: Bad Request - Invalid request parameters
 * - 401: Unauthorized - Authentication failed, check API key
 * - 403: Forbidden - Access denied to the resource
 * - 404: Not Found - Resource not found, check parameters
 * - 422: Unprocessable Entity - Validation error in request data
 * - 500: Internal Server Error - API server encountered an error
 * - Other codes: Generic error handling with error message
 *
 * @param context - The execution context
 * @param error - The error to handle
 * @throws NodeApiError for HTTP errors or NodeOperationError for other errors
 */
export function handleAPIError(context: IExecuteFunctions, error: any): never {
  const statusCode = getStatusCode(error);
  const errorMessage = getErrorMessage(error);
  const validationErrors = getValidationErrors(error);

  // Build detailed description for validation errors
  let description = '';
  if (validationErrors && validationErrors.length > 0) {
    const errorDetails = validationErrors
      .map((ve) => `  - ${ve.field}: ${ve.message}`)
      .join('\n');
    description = `Validation failed:\n${errorDetails}`;
  }

  switch (statusCode) {
    case APIErrorCode.BAD_REQUEST:
      throw createApiError(
        context,
        error,
        'Invalid request',
        description || 'The request parameters are invalid. Please check your input.',
      );

    case APIErrorCode.UNAUTHORIZED:
      throw createApiError(
        context,
        error,
        'Authentication failed',
        'Invalid API key or authentication credentials. Please check your credentials.',
      );

    case APIErrorCode.FORBIDDEN:
      throw createApiError(
        context,
        error,
        'Access denied',
        'You do not have permission to access this resource.',
      );

    case APIErrorCode.NOT_FOUND:
      throw createApiError(
        context,
        error,
        'Resource not found',
        'The requested resource was not found. Please check your parameters.',
      );

    case APIErrorCode.METHOD_NOT_ALLOWED:
      throw createApiError(
        context,
        error,
        'Method not allowed',
        'The HTTP method is not supported for this endpoint.',
      );

    case APIErrorCode.CONFLICT:
      throw createApiError(
        context,
        error,
        'Conflict',
        'The resource already exists or there is a conflict with the current state.',
      );

    case APIErrorCode.PAYLOAD_TOO_LARGE:
      throw createApiError(
        context,
        error,
        'Payload too large',
        'The request payload is too large. Please reduce the size of your request.',
      );

    case APIErrorCode.UNPROCESSABLE_ENTITY:
      throw createApiError(
        context,
        error,
        'Validation error',
        description || 'The request data failed validation. Please check your input fields.',
      );

    case APIErrorCode.TOO_MANY_REQUESTS:
      throw createApiError(
        context,
        error,
        'Rate limit exceeded',
        'Too many requests. Please wait before trying again.',
      );

    case APIErrorCode.INTERNAL_SERVER_ERROR:
      throw createApiError(
        context,
        error,
        'Server error',
        'The API server encountered an error while processing your request.',
      );

    case APIErrorCode.BAD_GATEWAY:
      throw createApiError(
        context,
        error,
        'Bad gateway',
        'The API server received an invalid response from an upstream server.',
      );

    case APIErrorCode.SERVICE_UNAVAILABLE:
      throw createApiError(
        context,
        error,
        'Service unavailable',
        'The API service is temporarily unavailable. Please try again later.',
      );

    case APIErrorCode.GATEWAY_TIMEOUT:
    case APIErrorCode.TIMEOUT:
      throw createApiError(
        context,
        error,
        'Request timeout',
        'The request took too long to complete. Please try again.',
      );

    default:
      throw createOperationError(context, `API request failed: ${errorMessage}`);
  }
}

/**
 * Wraps an async operation with error handling
 *
 * @param context - The execution context
 * @param operation - The async operation to execute
 * @returns Promise resolving to the operation result
 */
export async function withErrorHandling<T>(
  context: IExecuteFunctions,
  operation: () => Promise<T>,
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    handleAPIError(context, error);
  }
}
