/**
 * In-memory circular buffer for storing HTTP requests
 * Maintains a maximum of 100 requests with FIFO removal
 */

import { CapturedRequest } from '@/types/requests';
import { randomBytes } from 'crypto';

const MAX_REQUESTS = 100;

/**
 * Generate a short unique ID for requests
 * @returns Generated ID
 */
function generateRequestId(): string {
  return `req_${randomBytes(4).toString('hex')}`;
}

/**
 * Circular buffer implementation for request storage
 * Automatically removes oldest requests when capacity is exceeded
 */
class RequestStore {
  private requests: Map<string, CapturedRequest> = new Map();
  private order: string[] = [];

  /**
   * Add a new request to the store
   * Automatically removes oldest request if at capacity
   *
   * @param request - The request to store
   * @returns The stored request with assigned ID
   */
  addRequest(request: Omit<CapturedRequest, 'id'>): CapturedRequest {
    const id = generateRequestId();
    const storedRequest: CapturedRequest = {
      ...request,
      id,
    };

    // Remove oldest request if at capacity
    if (this.requests.size >= MAX_REQUESTS) {
      const oldestId = this.order.shift();
      if (oldestId) {
        this.requests.delete(oldestId);
      }
    }

    // Add new request
    this.requests.set(id, storedRequest);
    this.order.push(id);

    return storedRequest;
  }

  /**
   * Get a single request by ID
   *
   * @param id - The request ID
   * @returns The request or undefined if not found
   */
  getRequest(id: string): CapturedRequest | undefined {
    return this.requests.get(id);
  }

  /**
   * Get all stored requests in reverse chronological order (newest first)
   *
   * @returns Array of all stored requests
   */
  getAllRequests(): CapturedRequest[] {
    return this.order
      .slice()
      .reverse()
      .map(id => this.requests.get(id))
      .filter((req): req is CapturedRequest => req !== undefined);
  }

  /**
   * Delete a single request by ID
   *
   * @param id - The request ID to delete
   * @returns true if deleted, false if not found
   */
  deleteRequest(id: string): boolean {
    if (!this.requests.has(id)) {
      return false;
    }

    this.requests.delete(id);
    const index = this.order.indexOf(id);
    if (index > -1) {
      this.order.splice(index, 1);
    }

    return true;
  }

  /**
   * Clear all stored requests
   *
   * @returns Number of requests that were cleared
   */
  clearAll(): number {
    const count = this.requests.size;
    this.requests.clear();
    this.order = [];
    return count;
  }

  /**
   * Get the current number of stored requests
   *
   * @returns Number of requests in store
   */
  getCount(): number {
    return this.requests.size;
  }

  /**
   * Check if a request exists by ID
   *
   * @param id - The request ID
   * @returns true if request exists
   */
  hasRequest(id: string): boolean {
    return this.requests.has(id);
  }

  /**
   * Get requests within a date range
   * Useful for filtering/searching
   *
   * @param start - Start timestamp in milliseconds
   * @param end - End timestamp in milliseconds
   * @returns Requests within the range
   */
  getRequestsByTimeRange(start: number, end: number): CapturedRequest[] {
    return this.getAllRequests().filter(
      req => req.timestamp >= start && req.timestamp <= end
    );
  }

  /**
   * Get requests by HTTP method
   *
   * @param method - HTTP method to filter by
   * @returns Requests matching the method
   */
  getRequestsByMethod(method: string): CapturedRequest[] {
    return this.getAllRequests().filter(
      req => req.method === method.toUpperCase()
    );
  }

  /**
   * Get requests by path
   *
   * @param path - Path to filter by (supports partial match)
   * @returns Requests matching the path
   */
  getRequestsByPath(path: string): CapturedRequest[] {
    return this.getAllRequests().filter(req => req.path.includes(path));
  }
}

// Singleton instance
let store: RequestStore | null = null;

/**
 * Get or create the global request store instance
 * @returns The request store
 */
export function getRequestStore(): RequestStore {
  if (!store) {
    store = new RequestStore();
  }
  return store;
}

/**
 * Reset the request store (mainly for testing)
 */
export function resetRequestStore(): void {
  store = null;
}

// Export the store instance for convenience
export const requestStore = getRequestStore();
