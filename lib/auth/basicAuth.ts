/**
 * HTTP Basic Authentication utility functions
 * 
 * Provides helpers for encoding, decoding, and validating
 * HTTP Basic Authentication credentials
 */

/**
 * Represents decoded Basic Auth credentials
 */
export interface BasicAuthCredentials {
  username: string;
  password: string;
}

/**
 * Decode Base64 encoded credentials from Authorization header
 * 
 * @param authHeader - Authorization header value (e.g., "Basic dXNlcjpwYXNz")
 * @returns Decoded credentials or null if invalid format
 * 
 * @example
 * const creds = decodeBasicAuth('Basic dXNlcjpwYXNz');
 * // creds = { username: 'user', password: 'pass' }
 */
export function decodeBasicAuth(authHeader: string): BasicAuthCredentials | null {
  try {
    // Verify format
    if (!authHeader.startsWith('Basic ')) {
      return null;
    }

    // Extract and decode Base64
    const base64Credentials = authHeader.slice(6); // Remove 'Basic ' prefix
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');

    // Split into username and password
    const colonIndex = credentials.indexOf(':');
    if (colonIndex === -1) {
      return null;
    }

    return {
      username: credentials.slice(0, colonIndex),
      password: credentials.slice(colonIndex + 1),
    };
  } catch (error) {
    return null;
  }
}

/**
 * Encode username and password as Base64 for Authorization header
 * 
 * @param username - Username to encode
 * @param password - Password to encode
 * @returns Authorization header value (e.g., "Basic dXNlcjpwYXNz")
 * 
 * @example
 * const header = encodeBasicAuth('user', 'pass');
 * // header = "Basic dXNlcjpwYXNz"
 */
export function encodeBasicAuth(username: string, password: string): string {
  const credentials = `${username}:${password}`;
  const base64 = Buffer.from(credentials, 'utf-8').toString('base64');
  return `Basic ${base64}`;
}

/**
 * Check if Authorization header has valid Basic Auth format
 * 
 * @param authHeader - Authorization header value
 * @returns true if header has valid Basic Auth format
 * 
 * @example
 * isBasicAuthFormat('Basic dXNlcjpwYXNz'); // true
 * isBasicAuthFormat('Bearer token'); // false
 * isBasicAuthFormat('undefined'); // false
 */
export function isBasicAuthFormat(authHeader: string | null): boolean {
  if (!authHeader) {
    return false;
  }
  return authHeader.startsWith('Basic ');
}

/**
 * Validate credentials against expected username and password
 * 
 * @param credentials - Decoded credentials
 * @param expectedUsername - Expected username
 * @param expectedPassword - Expected password
 * @returns true if credentials match expectations
 * 
 * @example
 * const creds = { username: 'admin', password: 'secret' };
 * validateCredentials(creds, 'admin', 'secret'); // true
 * validateCredentials(creds, 'admin', 'wrong'); // false
 */
export function validateCredentials(
  credentials: BasicAuthCredentials,
  expectedUsername: string,
  expectedPassword: string,
): boolean {
  // Use timing-safe comparison to prevent timing attacks
  const usernameMatch = constantTimeCompare(credentials.username, expectedUsername);
  const passwordMatch = constantTimeCompare(credentials.password, expectedPassword);

  return usernameMatch && passwordMatch;
}

/**
 * Constant-time string comparison to prevent timing attacks
 * 
 * @param a - First string
 * @param b - Second string
 * @returns true if strings are equal
 */
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Extract realm from WWW-Authenticate header
 * 
 * @param realm - Realm name (e.g., "Dashboard Access")
 * @returns Complete WWW-Authenticate header value
 * 
 * @example
 * const header = createWwwAuthenticateHeader('Dashboard Access');
 * // header = 'Basic realm="Dashboard Access"'
 */
export function createWwwAuthenticateHeader(realm: string): string {
  // Escape any double quotes in realm name
  const escapedRealm = realm.replace(/"/g, '\\"');
  return `Basic realm="${escapedRealm}"`;
}
