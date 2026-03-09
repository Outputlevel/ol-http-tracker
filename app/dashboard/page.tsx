/**
 * Dashboard page - HTTP Request Tracker UI
 */

'use client';

import { useState, useEffect } from 'react';
import { CapturedRequest } from '@/types/requests';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Trash2, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RequestList } from '@/components/dashboard/request-list';
import { RequestDetail } from '@/components/dashboard/request-detail';
import { RequestDetailModal } from '@/components/dashboard/request-detail-modal';
import { useSocket } from '@/hooks/useSocket';
import { useMediaQuery } from '@/hooks/useMediaQuery';

export default function DashboardPage() {
  const {
    requests,
    isConnected,
    isLoading,
    error,
    isPollingStopped,
    deleteRequest,
    deleteAllRequests,
  } = useSocket();

  const [selectedRequest, setSelectedRequest] = useState<CapturedRequest | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Detect if we're on mobile (less than 768px = Tailwind's md breakpoint)
  const isMobile = useMediaQuery('(max-width: 767px');

  // Auto-select first request when requests update (desktop only)
  useEffect(() => {
    if (isMobile) return; // Don't auto-select on mobile

    if (requests.length > 0 && !selectedRequest) {
      setSelectedRequest(requests[0]);
    } else if (selectedRequest && !requests.find(r => r.id === selectedRequest.id)) {
      // If selected request was deleted, select the first one
      setSelectedRequest(requests[0] || null);
    }
  }, [requests, selectedRequest, isMobile]);

  // Open modal when request is selected on mobile
  useEffect(() => {
    if (isMobile && selectedRequest) {
      setIsModalOpen(true);
    }
  }, [selectedRequest, isMobile]);

  const handleSelectRequest = (request: CapturedRequest) => {
    setSelectedRequest(request);
    // Modal will automatically open through useEffect
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    if (isMobile) {
      setSelectedRequest(null);
    }
  };

  const handleDeleteRequest = async (requestId: string) => {
    await deleteRequest(requestId);
  };

  const handleClearAll = async () => {
    if (confirm('Are you sure you want to delete all requests?')) {
      await deleteAllRequests();
    }
  };

  return (
    <div className={`h-screen flex flex-col bg-background ${isMobile && isModalOpen ? 'overflow-hidden' : ''}`}>
      {/* Header */}
      <div className="border-b">
        <div className="px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold">HTTP Request Tracker</h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Monitor and inspect incoming HTTP requests in real-time
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    isConnected ? 'bg-green-500' : 'bg-red-500'
                  }`}
                />
                <span className="text-xs text-muted-foreground">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Polling Stopped Alert */}
      {isPollingStopped && (
        <Alert variant="destructive" className="mx-4 sm:mx-6 mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <AlertDescription className="text-xs sm:text-sm">{error || 'Polling stopped to reduce server load.'}</AlertDescription>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.location.reload()}
            className="gap-2 flex-shrink-0 w-full sm:w-auto"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Reload</span>
            <span className="sm:hidden">Reload Page</span>
          </Button>
        </Alert>
      )}

      {/* Error Alert */}
      {error && !isPollingStopped && (
        <Alert variant="destructive" className="mx-4 sm:mx-6 mt-4">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <AlertDescription className="text-xs sm:text-sm ml-2">{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Loading requests...
            </p>
          </div>
        </div>
      )}

      {/* Main Content */}
      {!isLoading && (
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Left Panel - Request List */}
          <div className="w-full md:w-1/3 md:border-r flex flex-col">
            {/* Toolbar */}
            <div className="border-b p-4 space-y-2">
              <p className="text-sm font-semibold">
                Requests ({requests.length})
              </p>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleClearAll}
                disabled={requests.length === 0 || isPollingStopped}
                className="w-full gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Clear All
              </Button>
            </div>

            {/* Request List */}
            <div className="flex-1 overflow-hidden">
              <RequestList
                requests={requests}
                selectedId={selectedRequest?.id}
                onSelect={handleSelectRequest}
                onDelete={handleDeleteRequest}
              />
            </div>
          </div>

          {/* Right Panel - Request Details (Desktop Only) */}
          {!isMobile && (
            <div className="w-2/3 overflow-hidden">
              <RequestDetail
                request={selectedRequest}
                onDelete={handleDeleteRequest}
              />
            </div>
          )}
        </div>
      )}

      {/* Request Detail Modal (Mobile Only) */}
      {isMobile && (
        <RequestDetailModal
          request={selectedRequest}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onDelete={handleDeleteRequest}
        />
      )}
    </div>
  );
}
