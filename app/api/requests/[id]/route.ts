/**
 * Individual Request Management
 * DELETE /api/requests/[id] - Delete a single request by ID
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRequestStore } from '@/lib/requestStore';
import { broadcastRequestsUpdated, getSocket } from '@/lib/socket';
import { DeleteRequestResponse, ApiErrorResponse } from '@/types/api';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * DELETE /api/requests/[id]
 * Delete a single request by ID
 *
 * @param request - Next.js request object
 * @param params - Route parameters containing request ID
 * @returns JSON response confirming deletion
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;

    console.log(`[DELETE /api/requests/${id}] Deleting request`);

    const store = getRequestStore();

    // Check if request exists
    if (!store.hasRequest(id)) {
      console.warn(`[DELETE /api/requests/${id}] Request not found`);

      const response: ApiErrorResponse = {
        success: false,
        error: 'Not Found',
        message: `Request with ID ${id} not found`,
        code: 'REQUEST_NOT_FOUND',
        statusCode: 404,
      };

      return NextResponse.json(response, { status: 404 });
    }

    // Delete the request
    const deleted = store.deleteRequest(id);

    if (!deleted) {
      const response: ApiErrorResponse = {
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to delete request',
        code: 'DELETE_FAILED',
        statusCode: 500,
      };

      return NextResponse.json(response, { status: 500 });
    }

    // Get updated count
    const remainingCount = store.getCount();

    // Broadcast update to all connected clients
    const io = getSocket();
    if (io) {
      broadcastRequestsUpdated([id], remainingCount);
    }

    const response: DeleteRequestResponse = {
      success: true,
      deletedCount: 1,
      deletedIds: [id],
      message: `Request ${id} deleted`,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('[DELETE /api/requests/[id]] Error:', error);

    const response: ApiErrorResponse = {
      success: false,
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error',
      statusCode: 500,
    };

    return NextResponse.json(response, { status: 500 });
  }
}
