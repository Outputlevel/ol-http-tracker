/**
 * Polling-based hook for real-time request updates
 * Uses fetch polling instead of Socket.IO for compatibility with Next.js 14+
 * 
 * Rate Limiting:
 * - Stops polling after 10 minutes (to reduce server load)
 * - Also stops if no new requests arrive for 3 minutes (inactivity)
 * - Requires page reload to resume polling
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { CapturedRequest } from '@/types/requests';

// Rate limiting constants (in milliseconds)
const MAX_POLLING_DURATION = 10 * 60 * 1000; // 10 minutes
const INACTIVITY_TIMEOUT = 3 * 60 * 1000; // 3 minutes of no new requests

/**
 * Hook to manage request polling and real-time request updates
 *
 * @returns Object with connection state and request data
 */
export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [requests, setRequests] = useState<CapturedRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPollingStopped, setIsPollingStopped] = useState(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollStartTimeRef = useRef<number | null>(null);
  const lastActivityTimeRef = useRef<number>(Date.now());
  const lastRequestCountRef = useRef<number>(0);

  // Fetch requests from server
  const fetchRequests = useCallback(async () => {
    try {
      const response = await fetch('/api/requests');
      if (!response.ok) throw new Error('Failed to fetch requests');
      
      const data = await response.json();
      // API returns { success, requests, count } - extract the requests array
      const requestsArray = Array.isArray(data) ? data : (data.requests || []);
      setRequests(requestsArray);
      setError(null);
      setIsConnected(true);

      // Update activity tracker if new requests arrived
      if (requestsArray.length > lastRequestCountRef.current) {
        lastActivityTimeRef.current = Date.now();
        lastRequestCountRef.current = requestsArray.length;
      }
    } catch (err) {
      console.error('[Polling] Fetch error:', err);
      setError(err instanceof Error ? err.message : 'Connection error');
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize polling
  useEffect(() => {
    console.log('[Polling] Starting request polling');
    console.log(`[Polling] Timeout settings: Max duration ${MAX_POLLING_DURATION / 1000 / 60}m, Inactivity timeout ${INACTIVITY_TIMEOUT / 1000 / 60}m`);
    setIsPollingStopped(false);
    pollStartTimeRef.current = Date.now();
    lastActivityTimeRef.current = Date.now();
    lastRequestCountRef.current = 0;
    
    // Initial fetch
    fetchRequests();

    // Poll for updates every 500ms
    pollIntervalRef.current = setInterval(() => {
      // Check rate limits
      const now = Date.now();
      const timeElapsed = now - (pollStartTimeRef.current || 0);
      const timeSinceActivity = now - lastActivityTimeRef.current;

      // Stop polling if max duration exceeded
      if (timeElapsed > MAX_POLLING_DURATION) {
        console.warn('[Polling] Max polling duration reached - stopping polling');
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
        }
        setIsPollingStopped(true);
        setError('Polling stopped to reduce server load. Please reload the page to resume.');
        return;
      }

      // Stop polling if inactive for too long
      if (timeSinceActivity > INACTIVITY_TIMEOUT) {
        console.warn('[Polling] Inactivity timeout reached - stopping polling');
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
        }
        setIsPollingStopped(true);
        setError('No new requests for a while. Please reload the page to resume polling.');
        return;
      }

      // Continue polling
      fetchRequests();
    }, 500);

    // Cleanup on unmount
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        console.log('[Polling] Stopped polling');
      }
    };
  }, [fetchRequests]);

  // Delete a single request
  const deleteRequest = useCallback(
    async (requestId: string) => {
      try {
        const response = await fetch(`/api/requests/${requestId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error(`Failed to delete request: ${response.statusText}`);
        }

        console.log('[Polling] Request deleted:', requestId);
        // Refresh list immediately
        await fetchRequests();
      } catch (err) {
        console.error('[Polling] Error deleting request:', err);
        setError('Failed to delete request');
      }
    },
    [fetchRequests]
  );

  // Delete all requests
  const deleteAllRequests = useCallback(async () => {
    try {
      const response = await fetch('/api/requests', {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to clear all requests: ${response.statusText}`);
      }

      console.log('[Polling] All requests deleted');
      // Refresh list immediately
      await fetchRequests();
    } catch (err) {
      console.error('[Polling] Error deleting all requests:', err);
      setError('Failed to clear requests');
    }
  }, [fetchRequests]);

  return {
    isConnected,
    requests,
    isLoading,
    error,
    isPollingStopped,
    deleteRequest,
    deleteAllRequests,
  };
}
