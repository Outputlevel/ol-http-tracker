/**
 * Socket.IO server initialization and event handling
 */

import { Server as HttpServer } from 'http';
import { Socket, Server } from 'socket.io';
import { CapturedRequest, RequestsUpdatedPayload, SocketErrorPayload } from '@/types/socket';

let io: Server | null = null;

/**
 * Initialize Socket.IO server
 * Should be called once during server startup
 *
 * @param httpServer - Node.js HTTP server instance
 * @returns Socket.IO server instance
 */
export function initializeSocket(httpServer: HttpServer): Server {
  if (io) {
    return io;
  }

  io = new Server(httpServer, {
    cors: {
      origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    maxHttpBufferSize: 10 * 1024 * 1024, // 10MB
  });

  // Handle client connections
  io.on('connection', (socket: Socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // Handle request for current request list
    socket.on('sync_requests', (callback) => {
      console.log(`[Socket.IO] Client ${socket.id} requested sync`);
      if (callback && typeof callback === 'function') {
        // Callback is handled by client - just emit the data
        socket.emit('sync_requests');
      }
    });

    // Handle client disconnection
    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error(`[Socket.IO] Error from client ${socket.id}:`, error);
    });
  });

  return io;
}

/**
 * Get the Socket.IO server instance
 * Must be called after initializeSocket()
 *
 * @returns Socket.IO server or null if not initialized
 */
export function getSocket(): Server | null {
  return io;
}

/**
 * Broadcast a newly captured request to all connected clients
 *
 * @param request - The captured request
 */
export function broadcastRequest(request: CapturedRequest): void {
  if (!io) {
    console.warn('[Socket.IO] Server not initialized - cannot broadcast request');
    return;
  }

  io.emit('request_received', request);
  console.log(`[Socket.IO] Broadcast request_received for ${request.method} ${request.path}`);
}

/**
 * Broadcast request deletion updates to all connected clients
 *
 * @param deletedIds - Array of deleted request IDs
 * @param remainingCount - Total requests remaining
 */
export function broadcastRequestsUpdated(
  deletedIds: string[],
  remainingCount: number
): void {
  if (!io) {
    console.warn('[Socket.IO] Server not initialized - cannot broadcast update');
    return;
  }

  const payload: RequestsUpdatedPayload = {
    type: 'deleted',
    deletedIds,
    remainingCount,
    timestamp: Date.now(),
  };

  io.emit('requests_updated', payload);
  console.log(
    `[Socket.IO] Broadcast requests_updated: deleted ${deletedIds.length}, remaining ${remainingCount}`
  );
}

/**
 * Send current request list to a specific client
 * Used when client connects and requests sync
 *
 * @param socketId - Socket ID of the client
 * @param requests - Array of requests to send
 */
export function syncRequestsToClient(
  socketId: string,
  requests: CapturedRequest[]
): void {
  if (!io) {
    console.warn('[Socket.IO] Server not initialized - cannot sync to client');
    return;
  }

  const socket = io.sockets.sockets.get(socketId);
  if (!socket) {
    console.warn(`[Socket.IO] Socket ${socketId} not found - cannot sync`);
    return;
  }

  socket.emit('requests_synced', requests);
  console.log(`[Socket.IO] Synced ${requests.length} requests to client ${socketId}`);
}

/**
 * Broadcast an error to all connected clients
 *
 * @param code - Error code
 * @param message - Error message
 */
export function broadcastError(code: string, message: string): void {
  if (!io) {
    console.warn('[Socket.IO] Server not initialized - cannot broadcast error');
    return;
  }

  const payload: SocketErrorPayload = {
    code,
    message,
    timestamp: Date.now(),
  };

  io.emit('error', payload);
  console.error(`[Socket.IO] Broadcast error: ${code} - ${message}`);
}

/**
 * Shutdown Socket.IO server gracefully
 */
export async function shutdownSocket(): Promise<void> {
  if (!io) {
    return;
  }

  return new Promise((resolve) => {
    io?.close(() => {
      console.log('[Socket.IO] Server shutdown');
      io = null;
      resolve();
    });
  });
}
