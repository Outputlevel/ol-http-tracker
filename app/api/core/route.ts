/**
 * Request Capture Endpoint
 * POST /api/core - Captures incoming HTTP requests
 *
 * Supports: GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey } from '@/lib/auth';
import { parseRequest } from '@/lib/requestParser';
import { getRequestStore } from '@/lib/requestStore';
import { broadcastRequest, getSocket } from '@/lib/socket';
import { CaptureRequestResponse, ApiErrorResponse } from '@/types/api';
import { RequestMethod } from '@/types/requests';

/**
 * Handle all HTTP methods for request capture
 */
async function handleRequest(request: NextRequest, method: string) {
  try {
    // Validate API key
    if (!validateApiKey(request)) {
      const response: ApiErrorResponse = {
        success: false,
        error: 'Unauthorized',
        message: 'Missing or invalid API-Key header',
        code: 'INVALID_API_KEY',
        statusCode: 401,
      };
      return NextResponse.json(response, { status: 401 });
    }

    // Parse request data
    console.log(`[/api/core] Capturing ${method} request from ${request.url}`);
    const rawRequestData = await parseRequest(request, method);

    // Store request in in-memory store
    const store = getRequestStore();
    const capturedRequest = store.addRequest({
      timestamp: Date.now(),
      ...rawRequestData,
      method: method as RequestMethod,
    });

    console.log(
      `[/api/core] Request stored: ${capturedRequest.id} - ${method} ${capturedRequest.path}`
    );

    // Emit Socket.IO event to connected clients
    const io = getSocket();
    if (io) {
      broadcastRequest(capturedRequest);
    } else {
      console.warn('[/api/core] Socket.IO not initialized - skipping broadcast');
    }

    // Return success response
    const response: CaptureRequestResponse = {
      success: true,
      requestId: capturedRequest.id,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('[/api/core] Error processing request:', error);

    const response: ApiErrorResponse = {
      success: false,
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error',
      code: 'PROCESSING_ERROR',
      statusCode: 500,
    };

    return NextResponse.json(response, { status: 500 });
  }
}

// Export handlers for each HTTP method
export async function GET(request: NextRequest) {
  return handleRequest(request, 'GET');
}

export async function POST(request: NextRequest) {
  return handleRequest(request, 'POST');
}

export async function PUT(request: NextRequest) {
  return handleRequest(request, 'PUT');
}

export async function PATCH(request: NextRequest) {
  return handleRequest(request, 'PATCH');
}

export async function DELETE(request: NextRequest) {
  return handleRequest(request, 'DELETE');
}

export async function HEAD(request: NextRequest) {
  return handleRequest(request, 'HEAD');
}

export async function OPTIONS(request: NextRequest) {
  return NextResponse.json(
    { message: 'OK' },
    {
      status: 200,
      headers: {
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, API-Key, X-API-Key',
      },
    }
  );
}
