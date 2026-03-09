# API Reference

## Request Capture Endpoint

### Endpoint

```
POST /api/core
GET /api/core
PUT /api/core
PATCH /api/core
DELETE /api/core
```

All HTTP methods are supported.

### Authentication

**Required Header:**
```
API-Key: <your-api-key>
```

### Request Example

```bash
curl -X POST http://localhost:3000/api/core \
  -H "API-Key: your-secret-key-12345" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "user.created",
    "userId": "12345",
    "timestamp": "2024-03-07T10:30:00Z"
  }'
```

### Success Response

**Status:** `200 OK`

```json
{
  "success": true,
  "message": "Request captured",
  "requestId": "req_abc123xyz"
}
```

### Error Responses

#### Missing API Key

**Status:** `401 Unauthorized`

```json
{
  "error": "Unauthorized",
  "message": "Missing API-Key header"
}
```

#### Invalid API Key

**Status:** `401 Unauthorized`

```json
{
  "error": "Unauthorized",
  "message": "Invalid API key"
}
```

#### IP Not Allowed

**Status:** `403 Forbidden`

```json
{
  "error": "Forbidden",
  "message": "Your IP address is not allowed"
}
```

#### Invalid Request Body

**Status:** `400 Bad Request`

```json
{
  "error": "Bad Request",
  "message": "Invalid JSON in request body"
}
```

---

## Request Management Endpoints

### Retrieve All Requests

```
GET /api/requests
```

**Authentication:** Basic Auth (if enabled) + IP Allowlist

**Response:**

```json
{
  "success": true,
  "count": 3,
  "requests": [
    {
      "id": "req_abc123",
      "timestamp": 1709873400000,
      "method": "POST",
      "url": "http://localhost:3000/api/core?test=1",
      "path": "/api/core",
      "query": {
        "test": "1"
      },
      "headers": {
        "host": "localhost:3000",
        "content-type": "application/json",
        "content-length": "45",
        "api-key": "***"
      },
      "body": {
        "event": "user.created",
        "userId": "12345"
      },
      "ip": "127.0.0.1",
      "contentType": "application/json",
      "contentLength": 45
    }
  ]
}
```

### Delete Single Request

```
DELETE /api/requests/{requestId}
```

**Authentication:** Basic Auth (if enabled) + IP Allowlist

**Response:**

```json
{
  "success": true,
  "message": "Request deleted"
}
```

### Delete All Requests

```
DELETE /api/requests
```

**Authentication:** Basic Auth (if enabled) + IP Allowlist

**Response:**

```json
{
  "success": true,
  "message": "All requests deleted",
  "deletedCount": 3
}
```

---

## Data Structures

### CapturedRequest

TypeScript interface for a stored request.

```typescript
interface CapturedRequest {
  // Unique identifier
  id: string;

  // Unix timestamp in milliseconds
  timestamp: number;

  // HTTP method
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

  // Full request URL including query string
  url: string;

  // Request path (without query string)
  path: string;

  // Parsed query parameters
  query: Record<string, string | string[]>;

  // All request headers (normalized to lowercase keys)
  headers: Record<string, string>;

  // Parsed request body (JSON object, string, or null)
  body: unknown;

  // Client IP address
  ip: string;

  // Content-Type header (extracted for convenience)
  contentType?: string;

  // Content-Length header (extracted for convenience)
  contentLength?: number;
}
```

### Example Request Object

```json
{
  "id": "req_d4f2a8c9",
  "timestamp": 1709873412345,
  "method": "POST",
  "url": "http://example.com/api/core?source=webhook&version=2",
  "path": "/api/core",
  "query": {
    "source": "webhook",
    "version": "2"
  },
  "headers": {
    "host": "example.com",
    "user-agent": "curl/7.64.1",
    "accept": "*/*",
    "content-type": "application/json",
    "content-length": "156",
    "x-webhook-signature": "sha256=abc123...",
    "api-key": "***"
  },
  "body": {
    "event": "payment.completed",
    "orderId": "order_xyz789",
    "amount": 99.99,
    "currency": "USD",
    "timestamp": "2024-03-07T15:30:12Z"
  },
  "ip": "203.0.113.42",
  "contentType": "application/json",
  "contentLength": 156
}
```

---

## WebSocket Events

### Client → Server

#### `sync_requests`

Emitted when a client connects to request the current list of stored requests.

**Emitted By:** Client automatically on connection

**Payload:** None

**Server Handler:**
```typescript
socket.on('sync_requests', () => {
  // Return current list of requests
  socket.emit('requests_synced', requests);
});
```

---

### Server → Client

#### `request_received`

Broadcast when a new request is captured at `/api/core`.

**Emitted By:** Server (broadcast to all connected clients)

**Event Name:** `request_received`

**Payload:**
```typescript
{
  id: string;
  timestamp: number;
  method: string;
  url: string;
  path: string;
  query: Record<string, any>;
  headers: Record<string, string>;
  body: unknown;
  ip: string;
  contentType?: string;
  contentLength?: number;
}
```

**Example Listener:**
```typescript
socket.on('request_received', (request: CapturedRequest) => {
  console.log(`New request: ${request.method} ${request.path}`);
  // Update dashboard UI
});
```

#### `requests_updated`

Broadcast when requests are deleted (individual or bulk).

**Emitted By:** Server (broadcast to all connected clients)

**Event Name:** `requests_updated`

**Payload:**
```typescript
{
  type: 'deleted'; // Indicates what changed
  deletedIds: string[]; // IDs of deleted requests
  remainingCount: number; // Total requests after deletion
}
```

**Example Listener:**
```typescript
socket.on('requests_updated', (update) => {
  console.log(`${update.deletedIds.length} request(s) deleted`);
  console.log(`${update.remainingCount} request(s) remaining`);
  // Refresh dashboard UI
});
```

#### `requests_synced`

Emitted when client first connects, containing the current list of stored requests.

**Emitted By:** Server (in response to `sync_requests`)

**Event Name:** `requests_synced`

**Payload:**
```typescript
CapturedRequest[] // Array of all currently stored requests
```

**Example Listener:**
```typescript
socket.on('requests_synced', (requests: CapturedRequest[]) => {
  console.log(`Synced ${requests.length} requests`);
  // Populate initial UI
});
```

### Error Events

#### `error`

Emitted when an error occurs during request processing.

**Emitted By:** Server (broadcast to all clients)

**Event Name:** `error`

**Payload:**
```typescript
{
  code: string; // 'INVALID_KEY' | 'PARSE_ERROR' | 'STORAGE_FULL' | etc.
  message: string; // Human-readable error description
  timestamp: number; // When error occurred
}
```

---

## Socket.IO Connection

### Client Connection

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3000', {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5
});

socket.on('connect', () => {
  console.log('Connected to request tracker');
  socket.emit('sync_requests');
});

socket.on('request_received', (request) => {
  console.log('New request:', request);
});

socket.on('requests_updated', (update) => {
  console.log('Requests updated:', update);
});

socket.on('disconnect', () => {
  console.log('Disconnected from server');
});
```

### Connection Parameters

- **Namespace:** `/` (default)
- **Path:** `/socket.io` (default)
- **Transport:** WebSocket (with fallback to HTTP polling)
- **Authentication:** If dashboard auth is enabled, WebSocket connection inherits browser's authenticated session

---

## Rate Limiting

Currently there is no built-in rate limiting. For production deployments, implement at the reverse proxy level:

### Nginx Example

```nginx
# Rate limiting configuration
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/s;
limit_req_zone $binary_remote_addr zone=dashboard_limit:10m rate=30r/s;

server {
    # Capture endpoint - higher limit for webhook integrations
    location /api/core {
        limit_req zone=api_limit burst=200 nodelay;
        proxy_pass http://backend;
    }

    # Dashboard - standard limit
    location / {
        limit_req zone=dashboard_limit burst=50 nodelay;
        proxy_pass http://backend;
    }
}
```

---

## API Key Format

**Recommended:** 32+ character alphanumeric string

**Example Generation:**

```bash
# Using Node.js crypto
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Using OpenSSL
openssl rand -hex 32

# Using Python
python3 -c "import secrets; print(secrets.token_hex(32))"
```

---

## Content-Type Handling

### Supported Content Types

| Content-Type | Handling |
|---|---|
| `application/json` | Parsed as JSON object |
| `application/x-www-form-urlencoded` | Parsed as form data object |
| `application/xml` | Stored as string |
| `text/plain` | Stored as string |
| `text/html` | Stored as string |
| `multipart/form-data` | Stored as string (binary data noted) |
| `application/octet-stream` | Stored as string |
| _(missing)_ | Assumed `application/json` |

### Body Size Limits

- **Default:** 10 MB per request
- **Recommendation:** Truncate bodies larger than 1 MB in display

---

## Header Security

Sensitive headers are masked in stored requests:

```javascript
const sensitiveHeaders = [
  'authorization',
  'api-key',
  'api_key',
  'x-api-key',
  'token',
  'password',
  'secret',
  'signature'
];
```

Example:
```json
{
  "headers": {
    "authorization": "Bearer ***",
    "api-key": "***",
    "x-webhook-signature": "***",
    "content-type": "application/json"
  }
}
```

---

## Timestamp Format

All timestamps are **Unix timestamps in milliseconds**.

```typescript
// Get current timestamp
const timestamp = Date.now(); // e.g., 1709873412345

// Convert to JavaScript Date
const date = new Date(timestamp);

// Human-readable format
const readable = date.toISOString(); // "2024-03-07T15:30:12.345Z"
```

---

## CORS

CORS is enabled for the `/api/core` endpoint to allow requests from different origins.

**Allowed Origins:** All (adjust in production)

**Allowed Methods:** GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD

**Allowed Headers:** Content-Type, API-Key

---

## Pagination (Future)

Once database backing is added:

```
GET /api/requests?page=1&limit=50&sort=timestamp:desc
```

Parameters:
- `page` - Page number (1-indexed)
- `limit` - Requests per page (max 100)
- `sort` - Sort field and direction (timestamp:desc, method:asc, etc.)
- `filter` - Filter by method, path, or status

Response will include pagination metadata:
```json
{
  "requests": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 12500,
    "pages": 250
  }
}
```
