/**
 * Request detail modal component - displays request info in a modal on mobile
 */

'use client';

import { useEffect } from 'react';
import { CapturedRequest } from '@/types/requests';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionItem } from '@/components/ui/accordion';
import { Trash2, X } from 'lucide-react';
import { MethodBadge } from './method-badge';
import { KeyValueTable } from './request-header-table';
import { RequestBodyViewer } from './request-body-viewer';
import { formatTime, formatBytes } from '@/lib/utils/formatting';
import { ScrollArea } from '@/components/ui/scroll-area';

interface RequestDetailModalProps {
  request: CapturedRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (id: string) => void;
}

export function RequestDetailModal({
  request,
  isOpen,
  onClose,
  onDelete,
}: RequestDetailModalProps) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  if (!isOpen || !request) return null;

  // Pre-compute counts
  const headerCount = Object.keys(request.headers).length;
  const queryCount = Object.keys(request.query).length;
  const hasBody = !!request.body;

  const handleDelete = async () => {
    await onDelete(request.id);
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/95 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <Card className="w-full max-h-[90vh] overflow-hidden flex flex-col max-w-2xl">
          {/* Header - Fixed */}
          <div className="flex items-center justify-between p-6 border-b bg-background flex-shrink-0">
            <h2 className="text-lg font-semibold">Request Details</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Scrollable Content Area */}
          <ScrollArea className="flex-1 h-0 w-full">
            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Request ID and Delete Button */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Request ID</p>
                  <p className="font-mono text-sm break-all">{request.id}</p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  className="gap-2 flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </Button>
              </div>

              <Separator />

              {/* Accordion Sections */}
              <Accordion type="multiple">
                {/* General Section */}
                <AccordionItem value="general" title="General" defaultOpen={true}>
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start">
                      <div className="sm:col-span-3">
                        <p className="text-xs text-muted-foreground mb-1">Method</p>
                        <MethodBadge method={request.method} />
                      </div>
                      <div className="sm:col-span-9">
                        <p className="text-xs text-muted-foreground mb-1">URL</p>
                        <p className="font-mono text-xs break-all">{request.url}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Timestamp</p>
                        <p className="text-sm">{formatTime(request.timestamp)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">IP Address</p>
                        <p className="text-sm font-mono">{request.ip}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          Content-Type
                        </p>
                        <p className="text-sm font-mono">
                          {request.contentType || '(none)'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          Content-Length
                        </p>
                        <p className="text-sm">
                          {request.contentLength
                            ? formatBytes(request.contentLength)
                            : '(none)'}
                        </p>
                      </div>
                    </div>
                  </div>
                </AccordionItem>

                {/* Headers Section */}
                <AccordionItem value="headers" title={`Headers (${headerCount})`} defaultOpen={false}>
                  <KeyValueTable data={request.headers} />
                </AccordionItem>

                {/* Query Parameters Section */}
                {queryCount > 0 && (
                  <AccordionItem value="query" title={`Query Parameters (${queryCount})`} defaultOpen={false}>
                    <KeyValueTable data={request.query} />
                  </AccordionItem>
                )}

                {/* Body Section */}
                {hasBody && (
                  <AccordionItem value="body" title="Body" defaultOpen={true}>
                    <RequestBodyViewer
                      body={request.body}
                      contentType={request.contentType}
                      maxHeight="max-h-60"
                    />
                  </AccordionItem>
                )}
              </Accordion>
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="border-t p-4 flex gap-2 flex-shrink-0">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Close
            </Button>
          </div>
        </Card>
      </div>
    </>
  );
}
