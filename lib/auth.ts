/**
 * Authentication and authorization utilities
 */

import { NextRequest } from 'next/server';

/**
 * Validate API key from request headers
 *
 * @param request - Next.js request object
 * @returns true if API key is valid, false otherwise
 */
export function validateApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get('api-key') || request.headers.get('x-api-key');

  if (!apiKey) {
    console.warn('[Auth] Missing API key in request');
    return false;
  }

  const expectedKey = process.env.API_KEY;

  if (!expectedKey) {
    console.error('[Auth] API_KEY environment variable not set');
    return false;
  }

  const isValid = apiKey === expectedKey;

  if (!isValid) {
    console.warn('[Auth] Invalid API key provided');
  }

  return isValid;
}

/**
 * Validate Basic Auth credentials from request
 *
 * @param request - Next.js request object
 * @returns true if credentials are valid, false otherwise
 */
export function validateBasicAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return false;
  }

  try {
    // Extract and decode credentials
    const base64Credentials = authHeader.slice(6); // Remove 'Basic ' prefix
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const [username, password] = credentials.split(':');

    const expectedUser = process.env.BASIC_AUTH_USER;
    const expectedPass = process.env.BASIC_AUTH_PASS;

    // If credentials are not configured in environment, deny access
    if (!expectedUser || !expectedPass) {
      console.warn('[Auth] Basic auth not configured (missing BASIC_AUTH_USER or BASIC_AUTH_PASS)');
      return false;
    }

    // Validate provided credentials against environment variables
    const isValid = username === expectedUser && password === expectedPass;

    if (!isValid) {
      console.warn('[Auth] Invalid basic auth credentials provided');
    }

    return isValid;
  } catch (error) {
    console.error('[Auth] Error validating basic auth:', error);
    return false;
  }
}

/**
 * Check if client IP is in the allowlist
 *
 * @param ip - Client IP address
 * @returns true if IP is allowed, false otherwise
 */
export function isIpAllowed(ip: string): boolean {
  const allowlistStr = process.env.ALLOWLIST_IPS;

  // If no allowlist is configured, allow all IPs
  if (!allowlistStr) {
    return true;
  }

  // Parse allowlist (comma-separated, supports CIDR notation)
  const allowedIps = allowlistStr.split(',').map(s => s.trim());

  // Check exact IP match or CIDR range match
  return allowedIps.some(allowed => {
    // Simple IP match (no CIDR support for now)
    if (allowed === ip) {
      return true;
    }

    // CIDR support (basic implementation)
    if (allowed.includes('/')) {
      return isIpInCidr(ip, allowed);
    }

    return false;
  });
}

/**
 * Check if IP matches CIDR range
 * Simplified implementation for IPv4
 *
 * @param ip - IP address to check
 * @param cidr - CIDR notation (e.g., "192.168.0.0/24")
 * @returns true if IP is in CIDR range
 */
function isIpInCidr(ip: string, cidr: string): boolean {
  try {
    const [network, maskBits] = cidr.split('/');
    const mask = parseInt(maskBits, 10);

    if (mask < 0 || mask > 32 || !network) {
      console.warn(`[Auth] Invalid CIDR notation: ${cidr}`);
      return false;
    }

    // Simple check: convert IPs to numbers and compare
    const ipNum = ipToNumber(ip);
    const networkNum = ipToNumber(network);

    if (ipNum === -1 || networkNum === -1) {
      return false;
    }

    // Create mask
    const maskNum = (0xffffffff << (32 - mask)) >>> 0;

    return (ipNum & maskNum) === (networkNum & maskNum);
  } catch (error) {
    console.error(`[Auth] Error checking CIDR: ${cidr}`, error);
    return false;
  }
}

/**
 * Convert IP address string to 32-bit number
 *
 * @param ip - IP address (e.g., "192.168.1.1")
 * @returns 32-bit representation or -1 if invalid
 */
function ipToNumber(ip: string): number {
  const parts = ip.split('.');

  if (parts.length !== 4) {
    return -1;
  }

  try {
    const bytes = parts.map(p => {
      const num = parseInt(p, 10);
      if (num < 0 || num > 255) {
        throw new Error(`Invalid octet: ${num}`);
      }
      return num;
    });

    return (
      ((bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3]) >>> 0
    );
  } catch {
    return -1;
  }
}

/**
 * Get client IP from request
 * Respects proxy headers
 *
 * @param request - Next.js request object
 * @returns Client IP address
 */
export function getClientIpFromRequest(request: NextRequest): string {
  const xForwardedFor = request.headers.get('x-forwarded-for');
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim();
  }

  const xRealIp = request.headers.get('x-real-ip');
  if (xRealIp) {
    return xRealIp;
  }

  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  // Try socket (may not work in all environments)
  try {
    const socket = (request as any).socket;
    if (socket?.remoteAddress) {
      return socket.remoteAddress;
    }
  } catch {
    // socket may not be available
  }

  return 'unknown';
}
