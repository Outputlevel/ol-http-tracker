# Tech Stack Documentation

This document explains the technologies used in the HTTP Request Tracker and how they work together.

## Technology Overview

```
┌─────────────────────────────────────────────────────────────┐
│                  HTTP Request Tracker Stack                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Frontend (Browser)                                         │
│  ├─ React 18+ (via Next.js)                                │
│  ├─ TailwindCSS - Utility-first CSS framework              │
│  ├─ shadcn/ui - Pre-built React components                │
│  └─ Socket.IO Client - Real-time communication             │
│                                                              │
│  Backend (Node.js Server)                                   │
│  ├─ Next.js 14+ (App Router)                               │
│  ├─ TypeScript - Type safety                               │
│  ├─ Socket.IO Server - Real-time events                    │
│  └─ Node.js APIs                                           │
│                                                              │
│  State & Persistence                                        │
│  └─ In-Memory Request Store                                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. Next.js (Framework & Runtime)

### What is Next.js?

Next.js is a React framework that provides:
- **Unified Development** - Single codebase for frontend and backend
- **File-based Routing** - Routes defined by folder structure
- **API Routes** - Built-in backend endpoints
- **Server-Side Rendering** - For SEO and performance
- **Middleware** - Authentication and request processing
- **Automatic Optimization** - Code splitting, image optimization

### Why Next.js for this project?

| Feature | Benefit |
|---------|---------|
| **App Router** | Modern file-based routing system |
| **API Routes** | No need for separate backend server |
| **Middleware** | Authentication checks before routes |
| **Built-in TypeScript** | Full type safety out of the box |
| **Server Components** | Efficient rendering and data fetching |
| **Edge Runtime** | Future scalability to edge networks |

### Key Next.js Features Used

#### 1. App Router (`/app` directory)

Routes defined by folder structure:

```
/app
├── page.tsx              → GET /
├── dashboard/
│   └── page.tsx          → GET /dashboard
└── api/
    ├── core/
    │   └── route.ts      → POST /api/core
    └── requests/
        ├── route.ts      → GET /api/requests, DELETE /api/requests
        └── [id]/
            └── route.ts  → DELETE /api/requests/[id]
```

**File to Route Mapping:**
```typescript
// app/page.tsx → GET /
export default function Home() {
  return <div>Home</div>;
}

// app/dashboard/page.tsx → GET /dashboard
export default function Dashboard() {
  return <div>Dashboard</div>;
}

// app/api/core/route.ts → POST /api/core
export async function POST(request: NextRequest) {
  return NextResponse.json({ success: true });
}
```

#### 2. API Routes (`app/api/` directory)

Backend endpoints using standard Node.js request/response:

```typescript
// app/api/requests/route.ts
import { NextRequest, NextResponse } from 'next/server';

// GET /api/requests
export async function GET(request: NextRequest) {
  const requests = await getStoredRequests();
  return NextResponse.json({
    success: true,
    requests: requests
  });
}

// DELETE /api/requests
export async function DELETE(request: NextRequest) {
  clearAllRequests();
  return NextResponse.json({
    success: true,
    message: 'All requests deleted'
  });
}
```

**Dynamic Routes with [id]:**
```typescript
// app/api/requests/[id]/route.ts
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  deleteRequest(id);
  
  return NextResponse.json({ success: true });
}
```

#### 3. Middleware (`middleware.ts`)

Runs before routes to check authentication:

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Check if accessing protected route
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    // Validate Basic Auth
    const auth = request.headers.get('authorization');
    if (!auth) {
      return new NextResponse('Unauthorized', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="Dashboard"'
        }
      });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/requests/:path*']
};
```

#### 4. Server Components

React components that run only on the server:

```typescript
// app/dashboard/page.tsx
// This component runs on the server
import { DashboardUI } from '@/components/dashboard/DashboardUI';

export default async function DashboardPage() {
  // Server-only code here
  const initialRequests = await getInitialRequests();

  return (
    <DashboardLayout>
      {/* Pass data to client component */}
      <DashboardUI initialRequests={initialRequests} />
    </DashboardLayout>
  );
}
```

#### 5. Client Components

React components that run in the browser:

```typescript
// components/dashboard/RequestList.tsx
'use client'; // Marks as client component

import { useEffect, useState } from 'react';
import { useSocket } from '@/lib/socket-client';

export function RequestList() {
  const [requests, setRequests] = useState([]);
  const socket = useSocket(); // Custom hook for Socket.IO

  useEffect(() => {
    socket?.on('request_received', (request) => {
      setRequests(prev => [request, ...prev]);
    });

    return () => {
      socket?.off('request_received');
    };
  }, [socket]);

  return (
    <div>
      {requests.map(req => (
        <div key={req.id}>{req.method} {req.path}</div>
      ))}
    </div>
  );
}
```

### Next.js Configuration

**next.config.ts:**
```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Enable React strict mode for development
  reactStrictMode: true,

  // Image optimization
  images: {
    unoptimized: true, // For deployment without Vercel
  },

  // Environment variables accessible in browser
  env: {
    NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL,
  },

  // Headers for security
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
        ],
      },
    ];
  },
};

export default nextConfig;
```

### Useful Next.js APIs

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

// Create JSON response
const response = NextResponse.json({ data: 'value' });

// Set cookie
response.cookies.set('session', 'token', { httpOnly: true });

// Redirect user
redirect('/dashboard');

// Get request headers
const apiKey = request.headers.get('api-key');

// Parse request body
const body = await request.json();

// Get URL parameters
const searchParams = request.nextUrl.searchParams;
const id = searchParams.get('id');
```

---

## 2. TypeScript

### What is TypeScript?

TypeScript adds static type checking to JavaScript:
- **Type Safety** - Catch errors before runtime
- **Better IDE Support** - Autocomplete and refactoring
- **Self-Documenting** - Types serve as documentation
- **Compiler Check** - Validates code before running

### Why TypeScript for this project?

```typescript
// ❌ Without TypeScript - Hard to catch errors
const request = getRequest();
console.log(request.body.userId); // Might not exist!

// ✅ With TypeScript - Errors caught at compile time
interface CapturedRequest {
  id: string;
  timestamp: number;
  body: unknown; // Explicitly unknown
}

const request: CapturedRequest = getRequest();
console.log(request.body.userId); // Error: body is unknown
```

### Key TypeScript Files

**types/requests.ts:**
```typescript
export interface CapturedRequest {
  id: string;
  timestamp: number;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url: string;
  path: string;
  query: Record<string, string | string[]>;
  headers: Record<string, string>;
  body: unknown;
  ip: string;
  contentType?: string;
  contentLength?: number;
}

export type RequestMethod = 
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'PATCH'
  | 'DELETE'
  | 'HEAD'
  | 'OPTIONS';

export interface DeleteRequestPayload {
  deleted: boolean;
  requestId: string;
}
```

**types/socket.ts:**
```typescript
export interface SocketEvents {
  'request_received': (request: CapturedRequest) => void;
  'requests_updated': (update: RequestsUpdate) => void;
  'requests_synced': (requests: CapturedRequest[]) => void;
  'error': (error: SocketError) => void;
}

export interface RequestsUpdate {
  type: 'deleted';
  deletedIds: string[];
  remainingCount: number;
}

export interface SocketError {
  code: string;
  message: string;
  timestamp: number;
}
```

### TypeScript Configuration

**tsconfig.json:**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "preserve",
    "module": "ESNext",
    
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "bundler",
    
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

---

## 3. Socket.IO (Real-time Communication)

### What is Socket.IO?

Socket.IO provides real-time bidirectional communication:
- **WebSocket** - Native browser support
- **Auto-fallback** - HTTP polling if WebSocket unavailable
- **Event-driven** - Send named events with data
- **Broadcasting** - Send to multiple clients at once
- **Rooms** - Group clients for targeted messaging

### Why Socket.IO for this project?

| Feature | Benefit |
|---------|---------|
| **Real-time Updates** | Dashboard updates instantly when requests arrive |
| **Two-way Communication** | Server pushes to clients, clients can request data |
| **Reliability** | Automatic reconnection and message buffering |
| **Browser Compatible** | Works in all modern browsers |
| **Scalable** | Can be extended with Redis adapter |

### Server Setup

**lib/socket.ts:**
```typescript
import { Server } from 'socket.io';
import { CapturedRequest } from '@/types/requests';

let io: Server | null = null;

export function initializeSocket(httpServer: any) {
  io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Client requests current request list
    socket.on('sync_requests', () => {
      const requests = getStoredRequests();
      socket.emit('requests_synced', requests);
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getSocket() {
  return io;
}

// Broadcast received request to all connected clients
export function broadcastRequest(request: CapturedRequest) {
  if (io) {
    io.emit('request_received', request);
  }
}

// Broadcast deletion update to all clients
export function broadcastUpdate(deletedIds: string[], remaining: number) {
  if (io) {
    io.emit('requests_updated', {
      type: 'deleted',
      deletedIds,
      remainingCount: remaining
    });
  }
}
```

### Client Setup

**lib/socket-client.ts:**
```typescript
'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Initialize socket connection
    if (!socket) {
      socket = io(undefined, {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5
      });

      socket.on('connect', () => {
        console.log('Connected to server');
        setIsConnected(true);
        
        // Request current list on connect
        socket?.emit('sync_requests');
      });

      socket.on('disconnect', () => {
        setIsConnected(false);
      });
    }

    return () => {
      // Don't disconnect on unmount - keep connection alive
    };
  }, []);

  return socket;
}

// Hook for receiving requests
export function useRequestReceiver(callback: (request: CapturedRequest) => void) {
  const socket = useSocket();

  useEffect(() => {
    socket?.on('request_received', callback);
    return () => {
      socket?.off('request_received', callback);
    };
  }, [socket, callback]);
}

// Hook for receiving updates
export function useRequestUpdates(callback: (update: RequestsUpdate) => void) {
  const socket = useSocket();

  useEffect(() => {
    socket?.on('requests_updated', callback);
    return () => {
      socket?.off('requests_updated', callback);
    };
  }, [socket, callback]);
}

// Hook for syncing initial requests
export function useRequestSync(callback: (requests: CapturedRequest[]) => void) {
  const socket = useSocket();

  useEffect(() => {
    socket?.on('requests_synced', callback);
    return () => {
      socket?.off('requests_synced', callback);
    };
  }, [socket, callback]);
}
```

### Events Emitted

**Server → Client (Broadcasting):**
```typescript
// When request captured
socket.emit('request_received', {
  id: 'req_123',
  timestamp: Date.now(),
  method: 'POST',
  path: '/api/example',
  // ... other request data
});

// When requests deleted
socket.emit('requests_updated', {
  type: 'deleted',
  deletedIds: ['req_123', 'req_456'],
  remainingCount: 98
});

// Response to sync_requests
socket.emit('requests_synced', [
  { id: 'req_1', ... },
  { id: 'req_2', ... },
  // ...
]);
```

**Client → Server (Events):**
```typescript
// Request current list on connect
socket.emit('sync_requests');
```

---

## 4. shadcn/ui (Component Library)

### What is shadcn/ui?

shadcn/ui is a collection of React components built on:
- **Radix UI** - Unstyled, accessible component primitives
- **TailwindCSS** - Styling and theming
- **Copy-Paste Components** - Not a dependency, components copied into your project

### Why shadcn/ui for this project?

| Feature | Benefit |
|---------|---------|
| **Accessible** | Built on Radix UI, WCAG compliant |
| **Customizable** | Full control - components in your codebase |
| **TypeScript** | Full type safety |
| **Dark Mode** | Built-in dark mode support |
| **Composable** | Mix and match components |

### Installation

```bash
# Install shadcn/ui CLI (using bun)
bun install -D shadcn-ui

# Or using npm
npm install -D shadcn-ui

# Initialize in project (prompts for config) - with bun
bun x shadcn-ui@latest init

# Or with npm
npx shadcn-ui@latest init

# Add components as needed (with bun)
bun x shadcn-ui@latest add button
bun x shadcn-ui@latest add table

# Or with npm
npx shadcn-ui@latest add button
npx shadcn-ui@latest add table
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label
npx shadcn-ui@latest add card
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add toast
```

### Common Components for This Project

**components/ui/button.tsx** (from shadcn/ui):
```typescript
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        default: 'bg-primary text-white hover:bg-primary/90',
        destructive: 'bg-red-600 text-white hover:bg-red-700',
        outline: 'border border-input bg-background hover:bg-accent',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3 text-xs',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  )
);
Button.displayName = 'Button';

export { Button, buttonVariants };
```

**Usage in Dashboard:**
```typescript
import { Button } from '@/components/ui/button';

export function DeleteButton({ requestId, onClick }: Props) {
  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={() => onClick(requestId)}
    >
      Delete
    </Button>
  );
}
```

### Common Components Implementation

**Table Component:**
```typescript
// From shadcn/ui - displays requests list
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Method</TableHead>
      <TableHead>Path</TableHead>
      <TableHead>Status</TableHead>
      <TableHead>Time</TableHead>
      <TableHead>Actions</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {requests.map((req) => (
      <TableRow key={req.id}>
        <TableCell>
          <Badge variant="outline">{req.method}</Badge>
        </TableCell>
        <TableCell className="font-mono text-sm">{req.path}</TableCell>
        <TableCell>200</TableCell>
        <TableCell>{new Date(req.timestamp).toLocaleTimeString()}</TableCell>
        <TableCell>
          <DropdownMenu>
            <DropdownMenuTrigger>More</DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => copyAsCurl(req)}>
                Copy as cURL
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => deleteRequest(req.id)}>
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

---

## 5. TailwindCSS (Styling)

### What is TailwindCSS?

TailwindCSS is a utility-first CSS framework:
- **Utility Classes** - Pre-defined CSS classes for styling
- **No Component Bloat** - Write your own components
- **Responsive Design** - Mobile-first with breakpoints
- **Dark Mode** - Built-in dark mode support
- **Customizable** - Full control over colors, spacing, etc.

### Why TailwindCSS for this project?

```typescript
// ✅ TailwindCSS - Fast UI development
<div className="flex items-center justify-between p-4 border rounded-lg shadow-md hover:shadow-lg transition-shadow">
  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
    Request Details
  </h2>
  <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
    Copy
  </button>
</div>

// ❌ Traditional CSS - More verbose
<style>
  .card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    border: 1px solid #ddd;
    border-radius: 0.5rem;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    transition: box-shadow 0.3s;
  }
  .card:hover {
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  }
</style>
```

### Configuration

**tailwind.config.ts:**
```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './app/**/*.tsx',
    './components/**/*.tsx',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0066cc',
        secondary: '#f5f5f5',
      },
      fontFamily: {
        mono: ['Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
};
export default config;
```

**globals.css:**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer components {
  /* Custom component classes */
  .btn-primary {
    @apply px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors;
  }

  .card {
    @apply border rounded-lg shadow-md p-4;
  }

  .table-cell-mono {
    @apply font-mono text-sm text-gray-600;
  }
}
```

### Responsive Design

```typescript
// Mobile-first design with TailwindCSS
<div className="
  grid grid-cols-1           // 1 column on mobile
  md:grid-cols-2             // 2 columns on medium screens
  lg:grid-cols-3             // 3 columns on large screens
  gap-4
  p-2 md:p-4 lg:p-6          // Responsive padding
">
  {/* Content */}
</div>
```

### Dark Mode

```typescript
// TailwindCSS dark mode support
<div className="bg-white dark:bg-slate-950 text-gray-900 dark:text-white">
  <h1 className="text-2xl font-bold">Dashboard</h1>
  <p className="text-gray-600 dark:text-gray-400">
    View your captured requests
  </p>
</div>
```

---

## 6. How They Work Together

### Request Flow with All Technologies

```
1. External Request Arrives
   ↓

2. Next.js API Route Handler (app/api/core/route.ts)
   ├─ TypeScript validates request type
   ├─ Parse with requestParser (validates headers, body)
   └─ Store in circular buffer (requestStore)
   ↓

3. Socket.IO Server Broadcast
   ├─ broadcastRequest() sends FORMATTED request
   └─ Uses TypeSocket event types for safety
   ↓

4. Browser Client (React + Socket.IO Client)
   ├─ Receives 'request_received' event
   ├─ Updates React state with new request
   └─ Re-renders RequestList component
   ↓

5. shadcn/ui + TailwindCSS Rendering
   ├─ Table component from shadcn/ui renders request
   ├─ TailwindCSS classes style the display
   └─ Dark mode support automatic
   ↓

6. User Interaction (Click Delete)
   ├─ Button onClick handler calls API
   ├─ Next.js route handler processes deletion
   └─ Socket.IO broadcasts update event
   ↓

7. Dashboard Updates in Real-time
   ├─ All connected clients receive update
   ├─ React re-renders with new state
   └─ UI reflects deletion instantly
```

### Component Integration Example

```typescript
// components/dashboard/RequestList.tsx
'use client';

import { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSocket } from '@/lib/socket-client';
import { useRequestReceiver, useRequestUpdates } from '@/lib/socket-client';
import { CapturedRequest } from '@/types/requests';

export function RequestList() {
  const [requests, setRequests] = useState<CapturedRequest[]>([]);
  const socket = useSocket();

  // Listen for new requests (Socket.IO + TypeScript)
  useRequestReceiver((request) => {
    setRequests(prev => [request, ...prev.slice(0, 99)]);
  });

  // Listen for deletions (Socket.IO)
  useRequestUpdates((update) => {
    if (update.type === 'deleted') {
      setRequests(prev =>
        prev.filter(req => !update.deletedIds.includes(req.id))
      );
    }
  });

  // Handle delete button click
  const handleDelete = async (requestId: string) => {
    const response = await fetch(`/api/requests/${requestId}`, {
      method: 'DELETE',
    });
    // Socket.IO will broadcast update automatically
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Method</TableHead>
          <TableHead>Path</TableHead>
          <TableHead>Time</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {requests.map((request) => (
          <TableRow key={request.id}>
            <TableCell>
              <Badge className="font-mono">
                {request.method}
              </Badge>
            </TableCell>
            <TableCell className="font-mono text-sm">
              {request.path}
            </TableCell>
            <TableCell className="text-sm text-gray-600">
              {new Date(request.timestamp).toLocaleTimeString()}
            </TableCell>
            <TableCell>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDelete(request.id)}
              >
                Delete
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

**Technologies Used in Above Component:**
- **React/Next.js** - 'use client' directive, hooks (useState, useEffect)
- **TypeScript** - Type annotations (CapturedRequest[])
- **Socket.IO** - useSocket(), useRequestReceiver(), useRequestUpdates()
- **shadcn/ui** - Table, TableBody, Button, Badge components
- **TailwindCSS** - className styling (font-mono, text-sm, etc.)

---

## Version Requirements

### Recommended Versions

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "socket.io": "^4.7.0",
    "socket.io-client": "^4.7.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/node": "^20.0.0",
    "@types/react": "^18.0.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0"
  }
}
```

### Compatibility

| Technology | Min Version | Recommended |
|---|---|---|
| Node.js | 18.0.0 | 20.0.0+ |
| Next.js | 14.0.0 | 14.1.0+ |
| React | 18.0.0 | 18.3.0+ |
| TypeScript | 4.9.0 | 5.3.0+ |
| TailwindCSS | 3.3.0 | 3.4.0+ |
| Socket.IO | 4.6.0 | 4.7.0+ |

---

## Development Workflow

### Development Server

```bash
# Install dependencies (using bun)
bun install

# Or using npm
npm install

# Run development server with hot reload (using bun)
bun run dev

# Or using npm
npm run dev

# Automatically:
# - Watches file changes
# - Hot module replacement (HMR)
# - Rebuilds on changes
# - Available at http://localhost:3000
```

### Building for Production

```bash
# Build Next.js application (using bun)
bun run build

# Or using npm
npm run build

# This:
# - Compiles TypeScript
# - Bundles CSS (TailwindCSS)
# - Optimizes components
# - Creates optimized output

# Test production build (using bun)
bun start

# Or using npm
npm start
```

### Debugging

**VS Code Debug Configuration (.vscode/launch.json):**
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js Server",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/next/dist/bin/next",
      "args": ["dev"],
      "cwd": "${workspaceFolder}"
    }
  ]
}
```

---

## Performance Optimization Tips

### Code Splitting

```typescript
// Lazy load heavy components
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(
  () => import('@/components/HeavyComponent'),
  { loading: () => <Spinner /> }
);

export function Dashboard() {
  return <HeavyComponent />;
}
```

### Image Optimization

```typescript
// Use Next.js Image component
import Image from 'next/image';

export function Icon() {
  return (
    <Image
      src="/logo.svg"
      alt="Logo"
      width={40}
      height={40}
      priority
    />
  );
}
```

### Database Queries (Server Components)

```typescript
// Server component - query in component
export async function RequestList() {
  const requests = await db.requests.findMany();
  
  return (
    <ClientRequestList initialRequests={requests} />
  );
}
```

---

## Additional Resources

### Documentation Links

- [Next.js Docs](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Socket.IO Documentation](https://socket.io/docs/)
- [shadcn/ui Components](https://ui.shadcn.com)
- [TailwindCSS Docs](https://tailwindcss.com/docs)

### Community & Support

- Next.js Discord
- TypeScript Community
- Socket.IO GitHub Discussions
- shadcn/ui GitHub Issues
- TailwindCSS Community Discord
