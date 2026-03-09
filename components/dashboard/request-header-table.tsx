/**
 * Key-value table component for headers and query parameters
 */

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface KeyValueTableProps {
  data: Record<string, string | string[]>;
}

export function KeyValueTable({ data }: KeyValueTableProps) {
  const entries = Object.entries(data);

  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        No entries
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Key</TableHead>
            <TableHead>Value</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map(([key, value]) => (
            <TableRow key={key}>
              <TableCell className="font-mono text-xs font-semibold break-all">
                {key}
              </TableCell>
              <TableCell className="font-mono text-xs break-all">
                {Array.isArray(value) ? value.join(', ') : value}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
