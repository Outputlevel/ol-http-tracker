/**
 * Request body viewer component
 * Displays JSON with pretty formatting or raw content
 */

import { useEffect, useState } from 'react';

interface RequestBodyViewerProps {
  body: unknown;
  contentType?: string;
  maxHeight?: string;
}

export function RequestBodyViewer({
  body,
  contentType,
  maxHeight = 'max-h-96',
}: RequestBodyViewerProps) {
  const [displayContent, setDisplayContent] = useState<string>('');

  useEffect(() => {
    if (!body) {
      setDisplayContent('(empty)');
      return;
    }

    // Check if body is JSON
    const isJson =
      contentType?.includes('application/json') ||
      (typeof body === 'object' && body !== null);

    if (isJson) {
      try {
        const jsonString =
          typeof body === 'string' ? body : JSON.stringify(body, null, 2);
        setDisplayContent(jsonString);
      } catch {
        // Fallback to raw content if JSON parsing fails
        setDisplayContent(String(body));
      }
    } else {
      setDisplayContent(String(body));
    }
  }, [body, contentType]);

  if (!displayContent || displayContent === '(empty)') {
    return (
      <p className="text-sm text-muted-foreground py-4">
        {displayContent || '(empty)'}
      </p>
    );
  }

  return (
    <pre className={`bg-muted p-4 rounded-md overflow-x-auto text-xs font-mono text-foreground ${maxHeight} overflow-y-auto`}>
      {displayContent}
    </pre>
  );
}
