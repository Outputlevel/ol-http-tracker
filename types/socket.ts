/**
 * Socket.IO event type definitions
 */

import { CapturedRequest } from './requests';

/**
 * Server-emitted events
 */
export interface ServerToClientEvents {
  /** Emitted when a new request is captured */
  request_received: (request: CapturedRequest) => void;

  /** Emitted when requests are deleted */
  requests_updated: (update: RequestsUpdatedPayload) => void;

  /** Emitted in response to sync_requests event */
  requests_synced: (requests: CapturedRequest[]) => void;

  /** Emitted when an error occurs */
  error: (error: SocketErrorPayload) => void;
}

/**
 * Client-emitted events
 */
export interface ClientToServerEvents {
  /** Client requests to sync current request list on connection */
  sync_requests: () => void;
}

/**
 * Socket.IO event payload for requesting update
 */
export interface RequestsUpdatedPayload {
  /** Type of update that occurred */
  type: 'deleted';

  /** IDs of deleted requests */
  deletedIds: string[];

  /** Total number of requests remaining */
  remainingCount: number;

  /** Timestamp of the update */
  timestamp: number;
}

/**
 * Socket.IO error payload
 */
export interface SocketErrorPayload {
  /** Error code identifier */
  code: string;

  /** Human-readable error message */
  message: string;

  /** When the error occurred */
  timestamp: number;
}

/**
 * Socket.IO Namespace/Socket instance (for type safety in handlers)
 */
export type Socket = import('socket.io').Socket<
  ClientToServerEvents,
  ServerToClientEvents
>;

/**
 * Socket.IO Server instance (for type safety)
 */
export type IOServer = import('socket.io').Server<
  ClientToServerEvents,
  ServerToClientEvents
>;

// Re-export CapturedRequest for convenience
export type { CapturedRequest } from './requests';
