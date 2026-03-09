/**
 * API response and request type definitions
 */

import { CapturedRequest } from './requests';

/**
 * Standard API success response
 */
export interface ApiSuccessResponse<T = any> {
  success: true;
  data?: T;
  message?: string;
}

/**
 * Standard API error response
 */
export interface ApiErrorResponse {
  success: false;
  error: string;
  message: string;
  code?: string;
  statusCode?: number;
}

/**
 * API response for capturing a request
 */
export interface CaptureRequestResponse extends ApiSuccessResponse {
  requestId: string;
}

/**
 * API response for retrieving requests
 */
export interface GetRequestsResponse extends ApiSuccessResponse {
  requests: CapturedRequest[];
  count: number;
}

/**
 * API response for deleting requests
 */
export interface DeleteRequestResponse extends ApiSuccessResponse {
  deletedCount: number;
  deletedIds?: string[];
}

/**
 * Webhook header for API key validation
 */
export interface ApiKeyHeader {
  'api-key': string;
}
