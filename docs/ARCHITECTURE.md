# Architecture Overview

## System Design

The HTTP Request Tracker is built on a client-server architecture with real-time bidirectional communication using Socket.IO.

### High-Level Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    Browser (Client)                          │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Dashboard UI                                          │  │
│  │  - Real-time request list                              │  │
│  │  - Request detail panel                                │  │
│  │  - Delete request buttons                              │  │
│  │  - Copy as cURL functionality                          │  │
│  └────────────────────────────────────────────────────────┘  │
│                           ▲                                   │
│                           │                                   │
│  ┌────────────────────────┴────────────────────────────────┐  │
│  │  Socket.IO Client                                      │  │
│  │  - Listens to `request_received` events                │  │
│  │  - Listens to `requests_updated` events                │  │
│  └────────────────────────┬────────────────────────────────┘  │
│                           │ WebSocket                         │
│                           └───────────────────┐               │
│                                               │               │
└───────────────────────────────────────────────┼───────────────┘
                                                │
                                                ▼
┌───────────────────────────────────────────────────────────────┐
│                  Next.js Server (Node.js)                     │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  HTTP Listener                                           │ │
│  │  PORT: 3000                                              │ │
│  └────────────────────┬─────────────────────────────────────┘ │
│                       │                                        │
│     ┌─────────────────┼─────────────────┐                     │
│     ▼                 ▼                 ▼                     │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────┐            │
│  │   GET    │  │   POST/PUT   │  │   Middleware │            │
│  │   /      │  │   PATCH/DEL  │  │              │            │
│  │          │  │   /api/core  │  │ - Auth Check │            │
│  │Dashboard │  │              │  │ - IP Allow   │            │
│  │   Page   │  │  API Handler │  │   - Rate Lim │            │
│  └────┬─────┘  └─────┬────────┘  │              │            │
│       │              │           └──────────────┘            │
│       │              │                                        │
│       └──────────────┼────────────────────┐                  │
│                      │                    ▼                  │
│                      │           ┌──────────────────┐        │
│                      │           │ Request Parser   │        │
│                      │           │                  │        │
│                      │           │ - Extract data   │        │
│                      │           │ - Parse headers  │        │
│                      │           │ - Parse body     │        │
│                      │           │ - Get IP/method  │        │
│                      │           └────────┬─────────┘        │
│                      │                    │                  │
│                      └────────────────────┼──────────┬───────┘
│                                           │          │
│                                    ┌──────▼────┐     │
│                                    │  Socket   │     │
│                                    │    IO     │     │
│                                    │  Server   │     │
│                                    └──────┬────┘     │
│                                           │          │
│                      ┌────────────────────┼──────────┘
│                      ▼                    ▼
│    ┌──────────────────────────────────────────────────┐
│    │  In-Memory Request Store                         │
│    │                                                   │
│    │  • Circular buffer (max 100 requests)             │
│    │  • Fast O(1) access                               │
│    │  • Automatic cleanup of old requests              │
│    │  • Thread-safe operations                         │
│    └──────────────────────────────────────────────────┘
│                      ▲
│                      │
│                      │ read/write
│                      │
│    ┌──────────────────────────────────────────────────┐
│    │  Event Emitters                                  │
│    │                                                   │
│    │  • request_received - New request logged         │
│    │  • requests_updated - Requests deleted           │
│    │  • error - Validation or processing errors       │
│    └──────────────────────────────────────────────────┘
│
└────────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. API Handler (`app/api/core/route.ts`)

Receives incoming HTTP requests and processes them.

**Responsibilities:**
- Validate API_KEY header
- Check IP allowlist (if configured)
- Parse request data (method, headers, body, IP)
- Store request in request store
- Emit Socket.IO event to connected clients
- Return appropriate HTTP responses

**Methods Supported:**
- GET
- POST
- PUT
- PATCH
- DELETE
- HEAD (pass-through)
- OPTIONS (pass-through)

**Response Codes:**
- `200 OK` - Request captured successfully
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Missing or invalid API key
- `403 Forbidden` - IP not in allowlist

### 2. Dashboard Page (`app/page.tsx`)

Server-side rendered dashboard landing page.

**Responsibilities:**
- Render authenticated dashboard UI
- Check Basic Auth credentials (if enabled)
- Check client IP against allowlist
- Serve protected content

**Security:**
- Runs authentication checks via middleware
- Only serves to authenticated users
- Returns 401/403 for unauthorized access

### 3. Request Store (`lib/requestStore.ts`)

In-memory circular buffer for storing requests.

**Features:**
- Maximum capacity: 100 requests
- Automatic removal of oldest requests when full
- Fast access times
- Thread-safe operations
- Provides iterator for clearing/filtering

**Data Structure:**
```typescript
interface StoredRequest {
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
```

### 4. Request Parser (`lib/requestParser.ts`)

Extracts and normalizes request data.

**Responsibilities:**
- Parse raw Node.js request object
- Extract headers and normalize them
- Parse request body as JSON/text
- Detect content type
- Extract client IP address (handles proxied requests)
- Build request object for storage

**Edge Cases:**
- Large request bodies
- Form-encoded data
- Binary data
- Missing headers
- X-Forwarded-For parsing for proxied requests

### 5. Socket.IO Server (`lib/socket.ts`)

Manages real-time communication with connected clients.

**Responsibilities:**
- Initialize Socket.IO server
- Manage client connections
- Broadcast request events to all connected clients
- Handle client disconnections
- Cleanup on server shutdown

**Events:**
- `request_received` - Emitted when new request is captured
- `requests_updated` - Emitted when requests are deleted
- `sync_requests` - Client request for full request list on connect

### 6. Middleware (`middleware.ts`)

Protects dashboard endpoints.

**Checks:**
- HTTP Basic Auth (if configured)
- IP allowlist (if configured)
- Valid session/authentication tokens

**Protects:**
- Dashboard pages
- Any public-facing routes

## Data Flow

### Request Capture Flow

```
1. External System
   │
   └─> POST /api/core + API-Key header
       │
       ▼
2. Next.js API Route Handler
   │
   ├─> Validate API-Key
   ├─> Check IP Allowlist
   └─> Parse Request
       │
       ▼
3. Request Parser
   │
   ├─> Extract method, URL, path, query
   ├─> Extract and normalize headers
   ├─> Parse body (JSON/text)
   └─> Detect IP address
       │
       ▼
4. In-Memory Store
   │
   ├─> Add request to circular buffer
   ├─> Auto-remove oldest if > 100
   └─> Generate unique ID
       │
       ▼
5. Socket.IO Broadcast
   │
   └─> Emit "request_received" to all clients
       │
       ▼
6. Dashboard Clients
   │
   ├─> Receive socket event
   ├─> Update request list UI
   └─> Display new request
```

### Dashboard View Flow

```
1. User Opens Browser
   │
   └─> GET /
       │
       ▼
2. Middleware Checks
   │
   ├─> Is Basic Auth required? Check credentials
   ├─> Is IP allowlist enabled? Check IP
   └─> Pass or reject request
       │
       ▼
3. Dashboard Page Renders
   │
   ├─> Next.js Server renders React component
   └─> Send HTML + CSS + JS to browser
       │
       ▼
4. Browser Executes JavaScript
   │
   ├─> Initialize Socket.IO client
   └─> Connect to Socket.IO server
       │
       ▼
5. Socket.IO Connection
   │
   ├─> Server identifies connecting client
   ├─> Sends current request list ("sync_requests")
   └─> Client renders initial state
       │
       ▼
6. Real-Time Updates
   │
   ├─> Client listens for "request_received" events
   ├─> Automatically updates UI
   └─> User sees live updates
```

### Request Deletion Flow

```
1. User Clicks Delete Button
   │
   ├─> Delete Single Request
   │   └─> Call DELETE /api/requests/{id}
   │
   └─> Delete All Requests
       └─> Call DELETE /api/requests
           │
           ▼
2. API Handler
   │
   ├─> Validate request authenticity
   ├─> Remove from request store
   └─> Emit "requests_updated" event
       │
       ▼
3. Socket.IO Broadcast
   │
   └─> Emit "requests_updated" to all clients
       │
       ▼
4. Dashboard Clients
   │
   ├─> Receive update event
   ├─> Re-fetch updated request list
   └─> Refresh UI
```

## Security Architecture

### Authentication Layers

#### 1. API Key Authentication
- **Purpose**: Protect `/api/core` endpoint
- **Implementation**: Header-based validation
- **Header Name**: `API-Key`
- **Validation**: Direct string comparison
- **Failure**: Returns 401 Unauthorized

#### 2. HTTP Basic Auth (Optional)
- **Purpose**: Protect dashboard access
- **Implementation**: Browser-based authentication
- **Credentials**: Username + Password
- **Storage**: In environment variables
- **Failure**: Returns 401 with auth prompt

#### 3. IP Allowlist (Optional)
- **Purpose**: Restrict access by IP address
- **Implementation**: Configurable list of allowed IPs
- **CIDR Support**: Optional for range matching
- **Proxy Support**: Respects X-Forwarded-For header
- **Failure**: Returns 403 Forbidden

### Environment-Based Security

All sensitive data stored in environment variables:
- `API_KEY` - API authentication token
- `BASIC_AUTH_USER` - Dashboard username
- `BASIC_AUTH_PASS` - Dashboard password
- `ALLOWLIST_IPS` - Comma-separated IP list

**Never committed to version control**

## Performance Considerations

### Memory Usage

- **Circular Buffer**: Max 100 requests × ~5KB = ~500KB
- **Socket Connections**: Minimal overhead per connection
- **No Database**: Fast in-memory operations (O(1) access)

### Scalability Limitations

Current design suitable for:
- Single server deployment
- Up to 50 concurrent WebSocket connections
- 100 captured requests at any time

**For scaling:**
- Add Redis for distributed request store
- Implement request archiving/database storage
- Use Socket.IO Redis adapter for multi-server setup

### Optimization Strategies

1. **Request Deduplication**: Filter identical requests
2. **Compression**: Compress request payloads
3. **Pagination**: Display requests in chunks
4. **Caching**: Cache frequently accessed requests
5. **Rate Limiting**: Limit Socket.IO events per client

## Deployment Architecture

### Single Server

```
Internet → Load Balancer/Reverse Proxy (Nginx)
             │
             ├─ TLS/SSL Termination
             ├─ REQUEST logging
             └─ Rate limiting
                 │
                 ▼
         Next.js Server (Node.js)
         │
         ├─ API routes
         ├─ Dashboard routes
         └─ Socket.IO server
```

### Multi-Server (Future)

```
Internet → Load Balancer
             │
             ├─> Server 1 (Next.js)
             ├─> Server 2 (Next.js)
             └─> Server 3 (Next.js)
                 │
                 └─> Redis (shared request store)
                     Socket.IO Adapter
```

## Error Handling

### Request Processing Errors

- **Invalid API Key** → 401 Unauthorized
- **Invalid JSON Body** → 400 Bad Request (still captures)
- **Missing Content-Type** → Assumes JSON, fallback to text
- **Oversized Payloads** → Accept but truncate in display

### Socket.IO Errors

- **Connection Drop** → Auto-reconnect client-side
- **Message Queue** → Buffer events during disconnection
- **Broadcast Failures** → Log but continue accepting requests

### Validation Errors

- **IP Allowlist Format** → Warn in logs, skip validation
- **Basic Auth Disabled** → Skip auth check gracefully
- **Missing Environment Variables** → Use safe defaults

## Code Organization

### Directory Structure

```
/app                          # Next.js app directory
  /api/core                   # Request capture endpoint
  /api/requests              # Request management endpoints
  layout.tsx                 # Root layout
  page.tsx                   # Dashboard page

/components                   # React components
  /RequestList              # Request list component
  /RequestDetail            # Request details panel
  /RequestActions           # Delete/copy controls

/lib                         # Utilities
  requestStore.ts           # Circular buffer
  requestParser.ts          # Request data extraction
  socket.ts                 # Socket.IO server setup
  auth.ts                   # Authentication helpers
  middleware.ts             # Auth & security checks

/types                       # TypeScript definitions
  requests.ts              # Request interfaces

/middleware.ts               # Next.js middleware
/next.config.ts             # Next.js configuration
/tsconfig.json              # TypeScript configuration
```

## Technology Choices

### Why Next.js?
- Built-in API routes eliminate separate backend
- Middleware for authentication/authorization
- Server-side rendering for dashboard
- Fast development and deployment
- Edge runtime support for future scaling

### Why Socket.IO?
- Proven real-time framework
- Automatic fallbacks (WebSocket → polling)
- Built-in room/namespace support
- Excellent browser compatibility
- Large community and ecosystem

### Why In-Memory Store?
- Simplest implementation for MVP
- Zero database setup/maintenance
- Fast O(1) access times
- Good for short-term request storage
- Extensible to persistent storage later

### Why TypeScript?
- Type safety catches errors early
- Better IDE support and autocomplete
- Self-documenting code
- Easier refactoring and maintenance
- Industry standard for modern Node.js

## Future Enhancement Paths

1. **Database Persistence** - PostgreSQL/MongoDB backing store
2. **Request Filtering** - Search, filter, group requests
3. **Webhooks** - Forward requests to other endpoints
4. **Pagination** - Handle unlimited request history
5. **Export** - Export requests as HAR, CSV, JSON
6. **Comparison** - Diff request snapshots
7. **Multi-User** - Role-based access control
8. **Metrics** - Request statistics and monitoring
9. **Replay** - Resend captured requests
10. **Plugins** - Extensible middleware system
