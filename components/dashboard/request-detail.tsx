/**
 * Request detail component - shows selected request information
 */

'use client';

import { CapturedRequest } from '@/types/requests';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionItem } from '@/components/ui/accordion';
import { Trash2 } from 'lucide-react';
import { MethodBadge } from './method-badge';
import { KeyValueTable } from './request-header-table';
import { RequestBodyViewer } from './request-body-viewer';
import { formatTime, formatBytes } from '@/lib/utils/formatting';
import { ScrollArea } from '@/components/ui/scroll-area';

interface RequestDetailProps {
  request: CapturedRequest | null;
  onDelete: (id: string) => void;
}

export function RequestDetail({ request, onDelete }: RequestDetailProps) {
  if (!request) {
    return (
      <Card className="flex items-center justify-center h-full text-center p-6">
        <div>
          <p className="text-sm text-muted-foreground">
            Select a request to view details.
          </p>
        </div>
      </Card>
    );
  }

  // Pre-compute counts to avoid function calls in JSX
  const headerCount = Object.keys(request.headers).length;
  const queryCount = Object.keys(request.query).length;
  const hasBody = !!request.body;

  return (
    <ScrollArea className="h-full w-full">
      <div className="p-6 space-y-6">
        {/* Request ID and Delete Button */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Request ID</p>
            <p className="font-mono text-sm break-all">{request.id}</p>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(request.id)}
            className="gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </Button>
        </div>

        <Separator />

        <Accordion type="multiple">
          {/* General Section */}
          <AccordionItem value="general" title="General" defaultOpen={true}>
            <div className="space-y-3">
              <div className="grid grid-cols-12 gap-4 items-start">
                <div className="col-span-3">
                  <p className="text-xs text-muted-foreground mb-1">Method</p>
                  <MethodBadge method={request.method} />
                </div>
                <div className="col-span-9">
                  <p className="text-xs text-muted-foreground mb-1">URL</p>
                  <p className="font-mono text-xs break-all">{request.url}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 items-start">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Timestamp</p>
                  <p className="text-sm">{formatTime(request.timestamp)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">IP Address</p>
                  <p className="text-sm font-mono">{request.ip}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 items-start">
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
              />
            </AccordionItem>
          )}
        </Accordion>
      </div>
    </ScrollArea>
  );
}
