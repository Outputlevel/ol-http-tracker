# Getting Started with Backend Implementation

Quick start guide for running and testing the HTTP Request Tracker backend.

## Prerequisites

- Node.js 18+ installed
- npm, yarn, or bun
- Terminal/command line

## Installation

```bash
# Install dependencies (using bun)
bun install

# Or using npm
npm install

# This installs:
# - Next.js 16.1.6
# - React 19.2.3
# - Socket.IO 4.7.2
# - TypeScript 5.x
# - TailwindCSS 4.x
# - And development tools
```

## Setup Environment Variables

```bash
# Copy template to local config
cp .env.example .env.local

# Generate a secure API key (using bun)
bun run generate-api-key

# Or using npm
npm run generate-api-key

# Output will show: sk_live_abcd1234...
# Copy that value
```

**Update .env.local:**

```bash
# Add generated API key
API_KEY=sk_live_YOUR_GENERATED_KEY_HERE

# Optional: Allow all IPs for development
# ALLOWLIST_IPS=

# Optional: Basic auth (for dashboard)
# BASIC_AUTH_USER=admin
# BASIC_AUTH_PASS=password123

# Node environment
NODE_ENV=development
```

## Start Development Server

```bash
# Using bun
bun run dev

# Or using npm
npm run dev

# Output:
# > next dev
# ...
# ▲ Next.js 16.1.6
# - Local: http://localhost:3000
# ...
```

Server is now running at `http://localhost:3000`

## Test Backend Endpoints

Open a new terminal and test the following:

### 1. Generate API Key (if not done yet)

```bash
# Using bun
bun run generate-api-key

# Or using npm
npm run generate-api-key

# Output example:
# ============================================================
# Generated API Key
# ============================================================
#
# your-api-key-here-32-chars-minimum
#
# Instructions:
# 1. Copy the API key above
# 2. Add it to your .env.local file:
#    API_KEY=sk_live_...
# ...
```

### 2. Test Capture Endpoint (POST /api/core)

```bash
# Replace YOUR_API_KEY with actual key from .env.local
curl -X POST http://localhost:3000/api/core \
  -H "API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"event": "user.created", "userId": "123"}'

# Success response:
# {"success":true,"requestId":"req_abc123"}
```

### 3. Test List Requests (GET /api/requests)

```bash
curl http://localhost:3000/api/requests

# Response:
# {
#   "success": true,
#   "count": 1,
#   "requests": [{
#     "id": "req_abc123",
#     "timestamp": 1709873400000,
#     "method": "POST",
#     "url": "http://localhost:3000/api/core",
#     "path": "/api/core",
#     "query": {},
#     "headers": {...},
#     "body": {...},
#     "ip": "127.0.0.1",
#     "contentType": "application/json",
#     "contentLength": 45
#   }]
# }
```

### 4. Test Different HTTP Methods

```bash
# GET request
curl -X GET http://localhost:3000/api/core \
  -H "API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json"

# PUT request
curl -X PUT http://localhost:3000/api/core \
  -H "API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"update": "data"}'

# PATCH request
curl -X PATCH http://localhost:3000/api/core \
  -H "API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"patch": "data"}'

# DELETE request
curl -X DELETE http://localhost:3000/api/core \
  -H "API-Key: YOUR_API_KEY"
```

### 5. Test Delete Single Request

```bash
# First, capture a request and note the ID
curl -X POST http://localhost:3000/api/core \
  -H "API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
# Response: {"success":true,"requestId":"req_abc123"}

# Delete it
curl -X DELETE http://localhost:3000/api/requests/req_abc123

# Response:
# {"success":true,"deletedCount":1,"deletedIds":["req_abc123"]}
```

### 6. Test Delete All Requests

```bash
# First capture some requests
curl -X POST http://localhost:3000/api/core \
  -H "API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"test": 1}'

curl -X POST http://localhost:3000/api/core \
  -H "API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"test": 2}'

# Delete all
curl -X DELETE http://localhost:3000/api/requests

# Response:
# {"success":true,"deletedCount":2}
```

### 7. Test Error Handling

```bash
# Missing API key
curl -X POST http://localhost:3000/api/core \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'

# Response (401):
# {"success":false,"error":"Unauthorized","message":"Missing or invalid API-Key header"}

# Invalid API key
curl -X POST http://localhost:3000/api/core \
  -H "API-Key: wrong_key" \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'

# Response (401):
# {"success":false,"error":"Unauthorized","message":"Missing or invalid API-Key header"}

# Request not found
curl -X DELETE http://localhost:3000/api/requests/req_nonexistent

# Response (404):
# {"success":false,"error":"Not Found","message":"Request with ID req_nonexistent not found"}
```

## Test Different Content Types

### JSON

```bash
curl -X POST http://localhost:3000/api/core \
  -H "API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"type": "json", "nested": {"key": "value"}}'
```

### Form Data

```bash
curl -X POST http://localhost:3000/api/core \
  -H "API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=john&password=secret"
```

### Plain Text

```bash
curl -X POST http://localhost:3000/api/core \
  -H "API-Key: YOUR_API_KEY" \
  -H "Content-Type: text/plain" \
  -d "This is plain text content"
```

### With Query Parameters

```bash
curl -X POST "http://localhost:3000/api/core?source=webhook&version=2" \
  -H "API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"data": "test"}'
```

## Test Security Features

### IP Allowlist

**Setup:**
```bash
# Add to .env.local
ALLOWLIST_IPS=127.0.0.1

# Restart development server (using bun or npm)
# bun run dev
# npm run dev
```

**Test:**
```bash
# From localhost (should work)
curl http://localhost:3000/api/requests

# From other IP (would require Basic Auth)
# This only affects /dashboard and /api/requests routes
```

### Basic Auth

**Setup:**
```bash
# Add to .env.local
BASIC_AUTH_USER=admin
BASIC_AUTH_PASS=password123
ALLOWLIST_IPS=192.168.1.0/24  # Restrict to specific IP range

# Restart development server
```

**Test:**
```bash
# Without credentials (should fail with 401)
curl http://localhost:3000/api/requests

# With credentials (should work)
curl -u admin:password123 http://localhost:3000/api/requests

# Or using Authorization header
curl -H "Authorization: Basic YWRtaW46cGFzc3dvcmQxMjM=" \
  http://localhost:3000/api/requests
```

## Monitor Application

### Check Logs

The terminal running `bun run dev` (or `npm run dev`) shows:

```
[/api/core] Capturing POST request from http://localhost:3000/api/core
[/api/core] Request stored: req_abc123 - POST /api/core
[Socket.IO] Broadcast request_received for POST /api/core
[GET /api/requests] Retrieving all requests
```

### Monitor Memory

Check request store state:

```bash
# Add temporary debug logging
# In app/api/requests/route.ts, add:
console.log('Store count:', store.getCount());
console.log('All requests:', store.getAllRequests());
```

## Build for Production

```bash
# Using bun
bun run build
bun start

# Or using npm
npm run build
npm start

# Application runs at http://localhost:3000 (default port)
```

## Run Type Checking

```bash
# Using bun
bun run type-check
bun run lint
bun run format

# Or using npm
npm run type-check
npm run lint
npm run format
```

## Troubleshooting

### "API_KEY is required" or "Missing or invalid API-Key header"

**Problem:** API key validation failing

**Solution:**
1. Check `.env.local` exists and has `API_KEY` set
2. Verify no spaces around the value
3. Restart dev server: `bun run dev` or `npm run dev`
4. Check header is exactly `API-Key` (case-sensitive)

```bash
# ✅ Correct header
-H "API-Key: sk_live_abc123"

# ❌ Wrong
-H "api-key: sk_live_abc123"
-H "API-KEY: sk_live_abc123"
```

### "Cannot find module" errors

**Problem:** Dependencies not installed

**Solution:**
```bash
# Clean install with bun
rm -rf node_modules bun.lockb
bun install

# Or with npm
rm -rf node_modules package-lock.json
npm install

# Restart server
bun run dev
```

### Socket.IO connection errors

These are expected during development. The dashboard isn't built yet, so Socket.IO has no clients. The server still broadcasts events correctly.

### "EADDRINUSE" - Port already in use

**Problem:** Something already using port 3000

**Solution:**
```bash
# Kill process using port 3000
# macOS/Linux
lsof -ti:3000 | xargs kill -9

# Windows
netstat -ano | findstr ":3000"
taskkill /PID <PID> /F

# Or use different port (with bun)
PORT=3001 bun run dev

# Or with npm
PORT=3001 npm run dev
```

## Next: Build Frontend

Once backend is tested and working:

1. Create dashboard UI components
2. Implement Socket.IO client integration
3. Build request list display
4. Add request detail panel
5. Implement delete and copy functionality

See [docs/BACKEND.md](./docs/BACKEND.md) for detailed component documentation.

## Useful Resources

- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Socket.IO Documentation](https://socket.io/docs/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [HTTP Status Codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)

## Getting Help

If something doesn't work:

1. Check [BACKEND.md](./docs/BACKEND.md) for detailed documentation
2. Review error messages in the console
3. Verify `.env.local` configuration
4. Restart development server
5. Check that all dependencies installed (`npm list`)

You're all set! The backend is ready for frontend integration. 🚀
