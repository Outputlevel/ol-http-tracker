# Backend Implementation Guide

This document explains the backend implementation of the HTTP Request Tracker.

## Overview

The backend consists of:
- **API Endpoints** - For capturing and managing requests
- **Request Parser** - Extracts data from incoming requests
- **Request Store** - In-memory circular buffer
- **Socket.IO Server** - Real-time event broadcasting
- **Authentication** - API key and basic auth
- **Middleware** - Security and authorization checks

## Backend Architecture

```
Client Request
     │
     ▼
[Middleware] → Check IP allowlist & Basic Auth
     │
     ▼
[API Route: /api/core] → Validate API-Key
     │
     ├─→ [Request Parser] → Extract metadata, headers, body
     │
     ├─→ [Request Store] → Store in circular buffer (max 100)
     │
     └─→ [Socket.IO Server] → Broadcast to connected clients
           │
           └─→ emit("request_received")
```

## File Structure

```
lib/
├── requestStore.ts      # Circular buffer for request storage
├── requestParser.ts     # Request data extraction
├── socket.ts           # Socket.IO server initialization
├── auth.ts             # Authentication utilities
├── socketSetup.ts      # Socket.IO setup helpers
└── utils/
    ├── formatting.ts   # Utility functions
    ├── logger.ts       # Logging utility
    └── constants.ts    # Application constants

app/
├── middleware.ts       # Next.js middleware
└── api/
    ├── core/          # POST /api/core - Capture endpoint
    │   └── route.ts
    └── requests/      # Request management
        ├── route.ts   # GET /api/requests, DELETE /api/requests
        └── [id]/
            └── route.ts  # DELETE /api/requests/[id]

types/
├── requests.ts        # Request interfaces
├── socket.ts         # Socket.IO event types
├── api.ts            # API response types
└── index.ts          # Re-exports

scripts/
└── generate-api-key.js  # Generate secure API keys
```

## Core Components

### 1. Request Store (lib/requestStore.ts)

**Purpose:** Store captured requests in memory using a circular buffer

**Features:**
- Maximum 100 requests
- FIFO removal when capacity exceeded
- Fast O(1) access
- Search by method, path, time range

**Usage:**
```typescript
import { getRequestStore } from '@/lib/requestStore';

const store = getRequestStore();

// Add request
const captured = store.addRequest({
  timestamp: Date.now(),
  method: 'POST',
  url: 'http://example.com/api',
  // ... other fields
});

// Get all requests
const allRequests = store.getAllRequests();

// Delete single request
store.deleteRequest(captured.id);

// Clear all
store.clearAll();
```

### 2. Request Parser (lib/requestParser.ts)

**Purpose:** Extract and normalize data from raw HTTP requests

**Features:**
- Parse method, URL, path, query parameters
- Extract and normalize headers
- Parse body based on content-type (JSON, form, multipart, text)
- Handle proxied requests (X-Forwarded-For)
- Mask sensitive headers

**Usage:**
```typescript
import { parseRequest } from '@/lib/requestParser';

const data = await parseRequest(request, 'POST');
// Returns: {
//   method: 'POST',
//   url: 'http://...',
//   path: '/api/core',
//   query: { ... },
//   headers: { ... },
//   body: { ... },
//   ip: '192.168.1.1',
//   contentType: 'application/json',
//   contentLength: 156
// }
```

### 3. Socket.IO Server (lib/socket.ts)

**Purpose:** Real-time communication with connected clients

**Features:**
- Broadcast request events to all clients
- Handle client connections/disconnections
- Sync current request list on client connect
- WebSocket with fallback to polling

**Usage:**
```typescript
import { 
  initializeSocket, 
  broadcastRequest, 
  broadcastRequestsUpdated 
} from '@/lib/socket';

// Initialize (call once on startup)
const io = initializeSocket(httpServer);

// Broadcast new request
broadcastRequest(capturedRequest);

// Broadcast deletion
broadcastRequestsUpdated(['req_id1', 'req_id2'], remainingCount);
```

### 4. Authentication (lib/auth.ts)

**Purpose:** Validate API keys, basic auth, and IP allowlist

**Features:**
- API key validation (header-based)
- HTTP Basic Auth support
- IP allowlist with CIDR support
- Proxy-aware IP detection

**Usage:**
```typescript
import { 
  validateApiKey, 
  validateBasicAuth, 
  isIpAllowed 
} from '@/lib/auth';

// Validate API key
if (!validateApiKey(request)) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

// Validate basic auth
if (!validateBasicAuth(request)) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

// Check IP allowlist
if (!isIpAllowed('192.168.1.1')) {
  // IP not allowed
}
```

### 5. API Endpoints

#### POST /api/core (Capture Endpoint)

Captures incoming HTTP requests.

**Supports:** GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS

**Requirements:**
- Header: `API-Key: <your-api-key>`

**Request:**
```bash
curl -X POST http://localhost:3000/api/core \
  -H "API-Key: sk_live_abc123" \
  -H "Content-Type: application/json" \
  -d '{"event": "test"}'
```

**Response (200 OK):**
```json
{
  "success": true,
  "requestId": "req_abc123"
}
```

**Error (401 Unauthorized):**
```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "Missing or invalid API-Key header"
}
```

#### GET /api/requests

Retrieve all stored requests.

**Request:**
```bash
curl http://localhost:3000/api/requests
```

**Response (200 OK):**
```json
{
  "success": true,
  "count": 3,
  "requests": [
    {
      "id": "req_abc123",
      "timestamp": 1709873400000,
      "method": "POST",
      "url": "http://localhost:3000/api/core",
      "path": "/api/core",
      "query": {},
      "headers": { ... },
      "body": { ... },
      "ip": "127.0.0.1",
      "contentType": "application/json",
      "contentLength": 45
    }
  ]
}
```

#### DELETE /api/requests

Delete all stored requests.

**Request:**
```bash
curl -X DELETE http://localhost:3000/api/requests
```

**Response (200 OK):**
```json
{
  "success": true,
  "deletedCount": 3
}
```

#### DELETE /api/requests/{id}

Delete a single request by ID.

**Request:**
```bash
curl -X DELETE http://localhost:3000/api/requests/req_abc123
```

**Response (200 OK):**
```json
{
  "success": true,
  "deletedCount": 1,
  "deletedIds": ["req_abc123"]
}
```

## Middleware

The middleware in `middleware.ts` protects dashboard routes.

**Protected Routes:**
- `/dashboard/*`
- `/api/requests/*`

**Security Checks:**
1. Check if client IP is in `ALLOWLIST_IPS`
2. If IP allowed → allow access
3. If IP not allowed → require Basic Auth
4. If no Basic Auth configured → allow all

**Example:**
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const clientIp = getClientIpFromRequest(request);

  if (!isIpAllowed(clientIp)) {
    if (!validateBasicAuth(request)) {
      return new NextResponse('Unauthorized', {
        status: 401,
        headers: { 'WWW-Authenticate': 'Basic realm="Dashboard"' }
      });
    }
  }

  return NextResponse.next();
}
```

## Socket.IO Events

### Server → Client

**event: "request_received"**
- Emitted when new request captured
- Payload: CapturedRequest object

**event: "requests_updated"**
- Emitted when requests deleted
- Payload: { type, deletedIds[], remainingCount }

**event: "requests_synced"**
- Emitted on client request for sync
- Payload: CapturedRequest[]

### Client → Server

**event: "sync_requests"**
- Client emits to request current request list
- No payload

## Environment Variables

**Required:**
- `API_KEY` - Authentication key for /api/core

**Optional:**
- `ALLOWLIST_IPS` - Comma-separated IP list (or CIDR ranges)
- `BASIC_AUTH_USER` - Dashboard username
- `BASIC_AUTH_PASS` - Dashboard password

**Example .env.local:**
```bash
API_KEY=sk_live_abc123xyz789
ALLOWLIST_IPS=192.168.1.0/24,10.0.0.5
BASIC_AUTH_USER=admin
BASIC_AUTH_PASS=password123
```

## Error Handling

### API Errors

All errors return consistent JSON response:

```json
{
  "success": false,
  "error": "Error Type",
  "message": "Detailed message",
  "code": "ERROR_CODE",
  "statusCode": 400
}
```

**Common Error Codes:**
- `INVALID_API_KEY` (401) - Missing/invalid API key
- `IP_NOT_ALLOWED` (403) - IP not in allowlist
- `AUTH_REQUIRED` (401) - Basic auth required
- `REQUEST_NOT_FOUND` (404) - Request ID not found
- `PARSING_ERROR` (400) - Failed to parse request
- `SERVER_ERROR` (500) - Unexpected server error

### Socket.IO Errors

Errors broadcast via `error` event:

```typescript
socket.on('error', (error) => {
  // {
  //   code: 'INVALID_KEY',
  //   message: 'API key validation failed',
  //   timestamp: 1709873400000
  // }
});
```

## Performance Considerations

### Memory Usage

- ~100 requests × ~5KB per request = ~500KB
- Socket.IO connections: ~10KB per connection
- Total: Low memory footprint

### Scalability

Current design suitable for:
- Single server deployment
- 50+ concurrent Socket.IO connections
- 100 captured requests

**To scale:**
- Add Redis for distributed store
- Use Socket.IO Redis adapter
- Archive old requests to database

## Testing

### Test Capture Endpoint

```bash
# Generate API key (using bun)
bun run generate-api-key

# Or using npm
npm run generate-api-key

# Send test request
curl -X POST http://localhost:3000/api/core \
  -H "API-Key: sk_live_YOUR_KEY_HERE" \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'

# Verify capture
curl http://localhost:3000/api/requests
```

### Test IP Allowlist

```bash
# Add to .env.local
ALLOWLIST_IPS=127.0.0.1

# This should work (from localhost)
curl http://localhost:3000/api/requests

# This would be blocked (from other IP)
# Requires Basic Auth if user/pass set
```

### Test Basic Auth

```bash
# With user:pass = user1:pass123
curl -u user1:pass123 http://localhost:3000/api/requests

# Base64 encoding: echo -n "user1:pass123" | base64
# dXNlcjE6cGFzczEyMw==
curl -H "Authorization: Basic dXNlcjE6cGFzczEyMw==" \
  http://localhost:3000/api/requests
```

## Debugging

### Enable Debug Logging

```bash
# All modules (using bun)
DEBUG=* bun run dev

# Or using npm
DEBUG=* npm run dev

# Specific modules (using bun)
DEBUG=http-tracker:* bun run dev
DEBUG=socket.io:* bun run dev

# Or using npm
DEBUG=http-tracker:* npm run dev
DEBUG=socket.io:* npm run dev
```

### Check Request Store

Add to your code:
```typescript
import { getRequestStore } from '@/lib/requestStore';

const store = getRequestStore();
console.log('Stored requests:', store.getAllRequests());
console.log('Count:', store.getCount());
```

### Monitor Socket.IO

```typescript
import { getSocket } from '@/lib/socket';

const io = getSocket();
console.log('Connected clients:', io?.engine.clientsCount);
```

## Production Checklist

- [ ] Generate unique `API_KEY`
- [ ] Set `ALLOWLIST_IPS` if restricting access
- [ ] Set `BASIC_AUTH_USER` and `BASIC_AUTH_PASS`
- [ ] Use HTTPS (configure in reverse proxy)
- [ ] Enable logging/monitoring
- [ ] Setup error tracking (Sentry, etc.)
- [ ] Configure rate limiting at proxy level
- [ ] Test all endpoints
- [ ] Verify Socket.IO connectivity
- [ ] Check memory usage under load

## Troubleshooting

### "API_KEY is required" Error

**Problem:** All requests to /api/core return 401

**Solution:**
1. Check `.env.local` has `API_KEY` set
2. Verify header is exactly `API-Key` (case-sensitive)
3. Verify no extra spaces in key
4. Restart dev server: `bun run dev` or `npm run dev`

### Socket.IO Not Connecting

**Problem:** Dashboard doesn't receive real-time updates

**Solution:**
1. Check Socket.IO server initialized
2. Verify WebSocket enabled in browser DevTools
3. Check for CORS issues
4. Check firewall/proxy blocking WebSocket

### Request Body Not Captured

**Problem:** Body is null/undefined

**Solution:**
1. Check Content-Type header set
2. Verify JSON is valid
3. Check body size < 10MB limit
4. Check request method (GET/HEAD don't parse bodies)

## Next Steps

Once backend is verified:
1. Build dashboard UI components
2. Implement Socket.IO client hooks
3. Create request list view
4. Add request detail panel
5. Implement delete functionality
6. Add copy as cURL feature
