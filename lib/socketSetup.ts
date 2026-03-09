/**
 * Socket.IO Initialization for Next.js
 * This file handles Socket.IO server setup and graceful shutdown
 */

import { Server as HttpServer } from 'http';
import { createServer } from 'http';
import { initializeSocket, getSocket, syncRequestsToClient } from '@/lib/socket';
import { getRequestStore } from '@/lib/requestStore';

let httpServer: HttpServer | null = null;
let socketInitialized = false;

/**
 * Initialize HTTP and Socket.IO servers
 * Call this once during application startup
 *
 * @param port - Port number for the HTTP server
 * @returns Promise that resolves when servers are ready
 */
export async function setupSocketIO(port: number = 3001): Promise<void> {
  if (socketInitialized) {
    console.log('[Socket.IO Setup] Already initialized');
    return;
  }

  try {
    // Create HTTP server for Socket.IO
    httpServer = createServer();

    // Initialize Socket.IO
    const io = initializeSocket(httpServer);

    // Set up event listener for client connections
    // When a client connects, ask for sync
    io.on('connection', (socket) => {
      console.log(`[Socket.IO Setup] New client connected: ${socket.id}`);

      // When client requests sync, send current requests
      socket.on('sync_requests', () => {
        console.log(`[Socket.IO Setup] Client ${socket.id} requesting sync`);
        const store = getRequestStore();
        const requests = store.getAllRequests();
        syncRequestsToClient(socket.id, requests);
      });
    });

    // Listen for HTTP connections (for Socket.IO polling fallback)
    httpServer.listen(port, () => {
      console.log(`[Socket.IO Setup] Server listening on port ${port}`);
    });

    socketInitialized = true;
    console.log('[Socket.IO Setup] Socket.IO initialized successfully');
  } catch (error) {
    console.error('[Socket.IO Setup] Failed to initialize:', error);
    throw error;
  }
}

/**
 * Gracefully shutdown Socket.IO and HTTP servers
 */
export async function shutdownSocketIO(): Promise<void> {
  if (!httpServer) {
    return;
  }

  return new Promise((resolve) => {
    httpServer?.close(() => {
      console.log('[Socket.IO Setup] Servers shut down');
      socketInitialized = false;
      resolve();
    });
  });
}

/**
 * Check if Socket.IO is initialized
 */
export function isSocketInitialized(): boolean {
  return socketInitialized;
}

/**
 * Get the HTTP server instance
 */
export function getHttpServer(): HttpServer | null {
  return httpServer;
}
