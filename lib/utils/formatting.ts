/**
 * Utility functions for the HTTP Request Tracker
 */

/**
 * Format a timestamp as a readable string
 *
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Formatted time string
 */
export function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
  });
}

/**
 * Format a timestamp as ISO string
 *
 * @param timestamp - Unix timestamp in milliseconds
 * @returns ISO format string
 */
export function formatTimestampISO(timestamp: number): string {
  return new Date(timestamp).toISOString();
}

/**
 * Pretty print JSON with indentation
 *
 * @param obj - Object to stringify
 * @param spaces - Number of spaces for indentation
 * @returns Formatted JSON string
 */
export function formatJson(obj: unknown, spaces: number = 2): string {
  try {
    return JSON.stringify(obj, null, spaces);
  } catch {
    return String(obj);
  }
}

/**
 * Format byte size as human-readable string
 *
 * @param bytes - Size in bytes
 * @returns Formatted size string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Truncate string to maximum length with ellipsis
 *
 * @param str - String to truncate
 * @param maxLength - Maximum length
 * @returns Truncated string
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) {
    return str;
  }
  return str.substring(0, maxLength - 3) + '...';
}

/**
 * Generate a cURL command from request data
 *
 * @param method - HTTP method
 * @param url - Request URL
 * @param headers - Request headers
 * @param body - Request body
 * @returns cURL command string
 */
export function generateCurl(
  method: string,
  url: string,
  headers: Record<string, string>,
  body?: unknown
): string {
  let curl = `curl -X ${method}`;

  // Add URL
  curl += ` "${url}"`;

  // Add headers
  for (const [key, value] of Object.entries(headers)) {
    curl += ` -H "${key}: ${value}"`;
  }

  // Add body if present
  if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    const bodyStr =
      typeof body === 'string'
        ? body
        : JSON.stringify(body);

    curl += ` -d '${bodyStr.replace(/'/g, "'\\''")}'`;
  }

  return curl;
}

/**
 * Mask sensitive data in objects
 *
 * @param obj - Object to mask
 * @param keysToMask - Keys to mask (case-insensitive)
 * @returns New object with masked values
 */
export function maskSensitiveData(
  obj: Record<string, any>,
  keysToMask: string[] = ['password', 'token', 'secret', 'api_key', 'authorization']
): Record<string, any> {
  const masked = { ...obj };
  const lowerKeysToMask = keysToMask.map(k => k.toLowerCase());

  for (const key in masked) {
    if (lowerKeysToMask.includes(key.toLowerCase())) {
      masked[key] = '***';
    } else if (typeof masked[key] === 'object' && masked[key] !== null) {
      masked[key] = maskSensitiveData(masked[key], keysToMask);
    }
  }

  return masked;
}

/**
 * Safely parse JSON string
 *
 * @param str - JSON string to parse
 * @returns Parsed object or null if invalid
 */
export function safeParseJson(str: string): unknown | null {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

/**
 * Check if string is valid JSON
 *
 * @param str - String to check
 * @returns true if valid JSON
 */
export function isValidJson(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get HTTP status text from code
 *
 * @param statusCode - HTTP status code
 * @returns Status text
 */
export function getStatusText(statusCode: number): string {
  const statusMap: Record<number, string> = {
    200: 'OK',
    201: 'Created',
    204: 'No Content',
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    405: 'Method Not Allowed',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
  };

  return statusMap[statusCode] || `HTTP ${statusCode}`;
}

/**
 * Generate a random ID
 *
 * @param prefix - Optional prefix
 * @param length - Length of random part
 * @returns Generated ID
 */
export function generateId(prefix: string = '', length: number = 12): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';

  for (let i = 0; i < length; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return prefix ? `${prefix}_${id}` : id;
}

/**
 * Deep clone an object (simple implementation)
 *
 * @param obj - Object to clone
 * @returns Cloned object
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as any;
  }

  if (obj instanceof Array) {
    return obj.map(item => deepClone(item)) as any;
  }

  if (obj instanceof Object) {
    const cloned: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = deepClone((obj as any)[key]);
      }
    }
    return cloned;
  }

  return obj;
}
