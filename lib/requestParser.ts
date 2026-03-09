/**
 * Request parser - extracts and normalizes data from raw HTTP requests
 */

import { NextRequest } from 'next/server';
import { ParsedBody, ParseBodyOptions, RawRequestData } from '@/types/requests';

/**
 * Sensitive headers that should be masked in stored requests
 */
const SENSITIVE_HEADERS = new Set([
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
  'cookie',
  'set-cookie',
]);

/**
 * Maximum request body size to store (10MB)
 */
const MAX_BODY_SIZE = 10 * 1024 * 1024;

/**
 * Get client IP address from request
 * Handles proxied requests with X-Forwarded-For header
 *
 * @param request - Next.js request object
 * @returns Client IP address
 */
export function getClientIp(request: NextRequest): string {
  // Check X-Forwarded-For header (set by reverse proxies)
  const xForwardedFor = request.headers.get('x-forwarded-for');
  if (xForwardedFor) {
    // Take the first IP if there are multiple
    return xForwardedFor.split(',')[0].trim();
  }

  // Check X-Real-IP header (alternative proxy header)
  const xRealIp = request.headers.get('x-real-ip');
  if (xRealIp) {
    return xRealIp;
  }

  // Check Cloudflare header
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  // Try to get from socket (direct connection)
  try {
    const socket = (request as any).socket;
    if (socket?.remoteAddress) {
      return socket.remoteAddress;
    }
  } catch {
    // Socket may not be available in all environments
  }

  // Fallback
  return 'unknown';
}

/**
 * Normalize header names and mask sensitive values
 *
 * @param headers - Raw headers object
 * @returns Normalized headers with masked sensitive values
 */
export function normalizeHeaders(
  headers: Record<string, string | string[]>
): Record<string, string> {
  const normalized: Record<string, string> = {};

  for (const [key, value] of Object.entries(headers)) {
    const lowerKey = key.toLowerCase();
    const stringValue = Array.isArray(value) ? value.join(', ') : value;

    // Mask sensitive headers
    if (SENSITIVE_HEADERS.has(lowerKey)) {
      normalized[lowerKey] = '***';
    } else {
      normalized[lowerKey] = stringValue;
    }
  }

  return normalized;
}

/**
 * Parse request body based on Content-Type
 * Handles JSON, form-urlencoded, plain text, and binary data
 *
 * @param request - Next.js request object
 * @param options - Parsing options
 * @returns Parsed body and metadata
 */
export async function parseBody(
  request: NextRequest,
  options: ParseBodyOptions = {}
): Promise<ParsedBody> {
  const contentType = options.contentType || request.headers.get('content-type') || '';
  const contentLength = parseInt(request.headers.get('content-length') || '0', 10);

  // Check size limits
  if (contentLength > MAX_BODY_SIZE) {
    return {
      body: null,
      contentType,
      contentLength,
      parseError: `Body exceeds maximum size of ${MAX_BODY_SIZE} bytes`,
    };
  }

  try {
    // Clone request to read body (can only be read once)
    const clonedRequest = request.clone();

    // Try to parse as JSON
    if (contentType.includes('application/json')) {
      try {
        const body = await clonedRequest.json();
        return { body, contentType, contentLength };
      } catch {
        // Fall through to text parsing if JSON fails
      }
    }

    // Try to parse as form data
    if (contentType.includes('application/x-www-form-urlencoded')) {
      try {
        const formData = await clonedRequest.formData();
        const body: Record<string, any> = {};

        for (const [key, value] of formData.entries()) {
          if (body[key]) {
            // Handle multiple values for same key
            if (Array.isArray(body[key])) {
              body[key].push(value);
            } else {
              body[key] = [body[key], value];
            }
          } else {
            body[key] = value;
          }
        }

        return { body, contentType, contentLength };
      } catch {
        // Fall through to text parsing if form parsing fails
      }
    }

    // Try to parse as multipart form data
    if (contentType.includes('multipart/form-data')) {
      try {
        const formData = await clonedRequest.formData();
        const body: Record<string, any> = {};
        let fileCount = 0;

        for (const [key, value] of formData.entries()) {
          if (value instanceof File) {
            fileCount++;
            body[key] = {
              filename: value.name,
              size: value.size,
              type: value.type,
            };
          } else {
            body[key] = value;
          }
        }

        if (fileCount > 0) {
          body._note = `Contains ${fileCount} file(s)`;
        }

        return { body, contentType, contentLength };
      } catch {
        // Fall through to text parsing if multipart parsing fails
      }
    }

    // Default to text parsing
    const text = await clonedRequest.text();
    const body = text || null;

    return { body, contentType, contentLength };
  } catch (error) {
    return {
      body: null,
      contentType,
      contentLength,
      parseError: error instanceof Error ? error.message : 'Unknown error parsing body',
    };
  }
}

/**
 * Parse query string into key-value pairs
 * Handles multiple values for same key
 *
 * @param searchParams - URL search parameters
 * @returns Parsed query object
 */
export function parseQuery(
  searchParams: URLSearchParams
): Record<string, string | string[]> {
  const query: Record<string, string | string[]> = {};

  for (const [key, value] of searchParams.entries()) {
    if (query[key]) {
      if (Array.isArray(query[key])) {
        (query[key] as string[]).push(value);
      } else {
        query[key] = [query[key] as string, value];
      }
    } else {
      query[key] = value;
    }
  }

  return query;
}

/**
 * Parse a complete HTTP request and extract all relevant data
 *
 * @param request - Next.js request object
 * @param method - HTTP method
 * @returns Parsed request data
 */
export async function parseRequest(
  request: NextRequest,
  method: string
): Promise<RawRequestData> {
  // Get URL information
  const url = request.url;
  const urlObj = new URL(url);
  const path = urlObj.pathname;
  const query = parseQuery(urlObj.searchParams);

  // Get headers (raw from iterator)
  const rawHeaders: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    rawHeaders[key] = value;
  });
  const headers = normalizeHeaders(rawHeaders);

  // Get client IP
  const ip = getClientIp(request);

  // Parse body (only for methods that typically have bodies)
  let parsedBody: ParsedBody = { body: null };
  if (['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
    parsedBody = await parseBody(request);
  }

  const contentType = parsedBody.contentType || '';
  const contentLength = parsedBody.contentLength || 0;

  return {
    method,
    url,
    path,
    query,
    headers,
    body: parsedBody.body,
    ip,
    contentType: contentType || undefined,
    contentLength: contentLength > 0 ? contentLength : undefined,
  };
}
