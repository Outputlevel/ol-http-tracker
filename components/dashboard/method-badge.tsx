/**
 * Method badge component with color coding
 */

import { RequestMethod } from '@/types/requests';
import { Badge } from '@/components/ui/badge';

interface MethodBadgeProps {
  method: RequestMethod;
}

export function MethodBadge({ method }: MethodBadgeProps) {
  const getVariant = (): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (method) {
      case 'GET':
        return 'default'; // blue
      case 'POST':
        return 'secondary'; // green
      case 'PUT':
      case 'PATCH':
        return 'outline'; // orange
      case 'DELETE':
        return 'destructive'; // red
      case 'HEAD':
      case 'OPTIONS':
        return 'secondary';
      default:
        return 'default';
    }
  };

  return (
    <Badge variant={getVariant()} className="font-mono font-semibold">
      {method}
    </Badge>
  );
}
