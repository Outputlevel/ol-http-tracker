/**
 * Next.js Middleware for request authentication and authorization
 * Runs before routes to check access permissions
 * 
 * Behavior:
 * - If HTTP_BASIC_AUTH is not set to true, bypass authentication completely
 * - If HTTP_BASIC_AUTH=true:
 *   1. Check IP allowlist first
 *   2. If IP is allowlisted, grant access
 *   3. If IP is not allowlisted, require HTTP Basic Authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateBasicAuth, isIpAllowed, getClientIpFromRequest } from '@/lib/auth';

/**
 * Middleware function runs for specified routes
 *
 * @param request - The incoming request
 * @returns NextResponse (allowed) or error response (denied)
 */
export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Only apply middleware to protected dashboard routes
  if (!pathname.startsWith('/dashboard')) {
    return NextResponse.next();
  }

  // Check if HTTP_BASIC_AUTH is enabled
  const httpBasicAuthEnabled = process.env.HTTP_BASIC_AUTH === 'true';

  // If HTTP_BASIC_AUTH is not enabled, bypass authentication completely
  if (!httpBasicAuthEnabled) {
    console.log(`[Middleware] HTTP_BASIC_AUTH disabled - allowing access to ${pathname}`);
    return NextResponse.next();
  }

  const clientIp = getClientIpFromRequest(request);
  console.log(`[Middleware] HTTP_BASIC_AUTH enabled. Request from ${clientIp} to ${pathname}`);

  // Step 1: Check IP allowlist first
  if (isIpAllowed(clientIp)) {
    console.log(`[Middleware] IP ${clientIp} is allowlisted - granting access`);
    return NextResponse.next();
  }

  // Step 2: IP is not allowlisted, require Basic Authentication
  console.log(`[Middleware] IP ${clientIp} is not allowlisted - requiring Basic Auth`);

  // Check for Authorization header
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    console.warn(`[Middleware] Missing or invalid Authorization header for IP ${clientIp}`);
    return new NextResponse('Unauthorized', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Dashboard Access"',
      },
    });
  }

  // Validate Basic Auth credentials
  const isAuthValid = validateBasicAuth(request);
  if (!isAuthValid) {
    console.warn(`[Middleware] Invalid credentials for IP ${clientIp}`);
    return new NextResponse('Unauthorized', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Dashboard Access"',
      },
    });
  }

  console.log(`[Middleware] Basic Auth validated for IP ${clientIp} - granting access`);
  return NextResponse.next();
}

/**
 * Configure which routes this middleware applies to
 * 
 * Protects only dashboard routes:
 * - /dashboard
 * - /dashboard/*
 * 
 * Does NOT protect:
 * - /api/* (API endpoints)
 * - /core (core endpoint)
 * - /socket.io (Socket.IO)
 */
export const config = {
  matcher: [
    '/dashboard',
    '/dashboard/:path*',
  ],
};
