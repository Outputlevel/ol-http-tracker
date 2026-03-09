/**
 * Request type definitions for the HTTP Request Tracker
 */

/**
 * HTTP method types supported by the tracker
 */
export type RequestMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'PATCH'
  | 'DELETE'
  | 'HEAD'
  | 'OPTIONS';

/**
 * Representation of a captured HTTP request
 */
export interface CapturedRequest {
  /** Unique request identifier (UUID) */
  id: string;

  /** Unix timestamp in milliseconds when request was received */
  timestamp: number;

  /** HTTP method */
  method: RequestMethod;

  /** Full request URL including query string */
  url: string;

  /** Request path without query string */
  path: string;

  /** Parsed query parameters */
  query: Record<string, string | string[]>;

  /** Request headers (normalized to lowercase keys, sensitive values masked) */
  headers: Record<string, string>;

  /** Request body (JSON object, string, or null) */
  body: unknown;

  /** Client IP address */
  ip: string;

  /** Content-Type header */
  contentType?: string;

  /** Content-Length header */
  contentLength?: number;
}

/**
 * Request data before validation (raw from parser)
 */
export interface RawRequestData {
  method: string;
  url: string;
  path: string;
  query: Record<string, string | string[]>;
  headers: Record<string, string>;
  body: unknown;
  ip: string;
  contentType?: string;
  contentLength?: number;
}

/**
 * Options for parsing request body
 */
export interface ParseBodyOptions {
  contentType?: string;
  maxSize?: number;
}

/**
 * Parsed body result
 */
export interface ParsedBody {
  body: unknown;
  contentType?: string;
  contentLength?: number;
  parseError?: string;
}
