/**
 * Request Management Endpoints
 * GET /api/requests - Retrieve all stored requests
 * DELETE /api/requests - Delete all stored requests
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRequestStore } from '@/lib/requestStore';
import { broadcastRequestsUpdated, getSocket } from '@/lib/socket';
import { GetRequestsResponse, DeleteRequestResponse, ApiErrorResponse } from '@/types/api';

/**
 * GET /api/requests
 * Retrieve all stored requests
 *
 * @param request - Next.js request object
 * @returns JSON response with stored requests
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[GET /api/requests] Retrieving all requests');

    const store = getRequestStore();
    const requests = store.getAllRequests();

    const response: GetRequestsResponse = {
      success: true,
      requests,
      count: requests.length,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('[GET /api/requests] Error:', error);

    const response: ApiErrorResponse = {
      success: false,
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error',
      statusCode: 500,
    };

    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * DELETE /api/requests
 * Delete all stored requests
 *
 * @param request - Next.js request object
 * @returns JSON response confirming deletion
 */
export async function DELETE(request: NextRequest) {
  try {
    console.log('[DELETE /api/requests] Clearing all requests');

    const store = getRequestStore();
    const deletedCount = store.clearAll();

    // Broadcast update to all connected clients
    const io = getSocket();
    if (io) {
      broadcastRequestsUpdated([], 0);
    }

    const response: DeleteRequestResponse = {
      success: true,
      deletedCount,
      message: `Deleted ${deletedCount} request(s)`,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('[DELETE /api/requests] Error:', error);

    const response: ApiErrorResponse = {
      success: false,
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error',
      statusCode: 500,
    };

    return NextResponse.json(response, { status: 500 });
  }
}
