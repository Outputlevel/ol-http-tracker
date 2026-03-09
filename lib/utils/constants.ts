/**
 * Application-wide constants
 */

/**
 * Request storage limits
 */
export const STORAGE = {
  MAX_REQUESTS: 100,
  MAX_BODY_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_HEADER_SIZE: 16 * 1024, // 16KB
} as const;

/**
 * HTTP methods supported by the tracker
 */
export const HTTP_METHODS = [
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'HEAD',
  'OPTIONS',
] as const;

/**
 * API endpoints
 */
export const API_ENDPOINTS = {
  CAPTURE: '/api/core',
  REQUESTS_LIST: '/api/requests',
  REQUEST_DELETE: '/api/requests/:id',
} as const;

/**
 * Socket.IO events
 */
export const SOCKET_EVENTS = {
  // Server to client
  REQUEST_RECEIVED: 'request_received',
  REQUESTS_UPDATED: 'requests_updated',
  REQUESTS_SYNCED: 'requests_synced',
  ERROR: 'error',

  // Client to server
  SYNC_REQUESTS: 'sync_requests',
} as const;

/**
 * Content type patterns
 */
export const CONTENT_TYPES = {
  JSON: /application\/json/i,
  FORM: /application\/x-www-form-urlencoded/i,
  MULTIPART: /multipart\/form-data/i,
  TEXT: /text\//i,
  HTML: /text\/html/i,
  XML: /application\/xml/i,
} as const;

/**
 * Sensitive headers that should be masked
 */
export const SENSITIVE_HEADERS = new Set([
  'authorization',
  'api-key',
  'api_key',
  'x-api-key',
  'x-auth-token',
  'x-access-token',
  'token',
  'password',
  'secret',
  'signature',
  'x-webhook-signature',
  'x-github-token',
  'x-stripe-token',
  'x-gitlab-token',
  'x-bitbucket-token',
  'cookie',
  'set-cookie',
  'x-csrf-token',
  'x-xsrf-token',
]) as ReadonlySet<string>;

/**
 * Response codes
 */
export const RESPONSE_CODES = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  GONE: 410,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
} as const;

/**
 * Error codes
 */
export const ERROR_CODES = {
  INVALID_API_KEY: 'INVALID_API_KEY',
  IP_NOT_ALLOWED: 'IP_NOT_ALLOWED',
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  REQUEST_NOT_FOUND: 'REQUEST_NOT_FOUND',
  INVALID_REQUEST: 'INVALID_REQUEST',
  PARSING_ERROR: 'PARSING_ERROR',
  STORAGE_FULL: 'STORAGE_FULL',
  SERVER_ERROR: 'SERVER_ERROR',
} as const;

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG = {
  PORT: 3000,
  SOCKET_PORT: 3001,
  REQUEST_TIMEOUT: 30000, // 30 seconds
  SOCKET_RECONNECT_DELAY: 1000,
  SOCKET_MAX_RECONNECT_ATTEMPTS: 5,
} as const;

/**
 * Date/Time formats
 */
export const DATE_FORMATS = {
  ISO: 'YYYY-MM-DDTHH:mm:ss.SSSZ',
  DATETIME: 'YYYY-MM-DD HH:mm:ss',
  TIME: 'HH:mm:ss',
  DATE: 'YYYY-MM-DD',
} as const;

/**
 * Environment variable names
 */
export const ENV_VARS = {
  API_KEY: 'API_KEY',
  BASIC_AUTH_USER: 'BASIC_AUTH_USER',
  BASIC_AUTH_PASS: 'BASIC_AUTH_PASS',
  ALLOWLIST_IPS: 'ALLOWLIST_IPS',
  NODE_ENV: 'NODE_ENV',
  DEBUG: 'DEBUG',
  PORT: 'PORT',
  SOCKET_PORT: 'SOCKET_PORT',
} as const;

/**
 * Environment modes
 */
export const ENVIRONMENTS = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
  TEST: 'test',
} as const;
