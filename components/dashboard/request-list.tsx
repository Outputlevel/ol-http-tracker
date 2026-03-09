/**
 * Request list component - displays all captured requests
 */

'use client';

import { CapturedRequest } from '@/types/requests';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { MethodBadge } from './method-badge';
import { formatTime } from '@/lib/utils/formatting';
import { cn } from '@/lib/utils';
import { Trash2 } from 'lucide-react';

interface RequestListProps {
  requests: CapturedRequest[];
  selectedId?: string;
  onSelect: (request: CapturedRequest) => void;
  onDelete: (requestId: string) => Promise<void>;
}

export function RequestList({
  requests,
  selectedId,
  onSelect,
  onDelete,
}: RequestListProps) {
  if (requests.length === 0) {
    return (
      <Card className="flex items-center justify-center h-full text-center p-6">
        <div>
          <p className="text-sm text-muted-foreground">
            No requests captured yet.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Send requests to the /api/core endpoint to see them here.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <ScrollArea className="h-full w-full">
      <div className="p-4 space-y-2">
        {requests.map((request) => (
          <div key={request.id}>
            <div
              className={cn(
                'rounded-md transition-colors border',
                selectedId === request.id ? 'bg-primary/10 border-primary' : 'border-transparent hover:bg-muted'
              )}
            >
              <div className="flex items-start gap-3 p-3">
                <button
                  onClick={() => onSelect(request)}
                  className="flex-1 text-left focus:outline-none"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <MethodBadge method={request.method} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{request.path}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatTime(request.timestamp)}
                      </p>
                    </div>
                  </div>
                </button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(request.id)}
                  className="flex-shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <Separator className="mt-2" />
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
