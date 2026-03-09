# HTTP Request Tracker

A lightweight, real-time HTTP request inspection dashboard built with Next.js and Socket.IO. Perfect for developers who need to inspect and debug webhook requests, API integrations, and HTTP traffic in real-time.

## Features

- **Real-time Request Capture** - Automatically capture and display incoming HTTP requests
- **Live Dashboard** - View request details as they arrive with zero latency
- **Comprehensive Request Data** - Capture headers, body, metadata, IP address, and more
- **Request Management** - Delete individual requests or clear all captured requests
- **API Key Authentication** - Secure endpoint with API key verification
- **Optional Basic Auth** - Protect dashboard access with HTTP Basic Authentication
- **IP Allowlist** - Restrict dashboard access by IP address
- **In-Memory Storage** - Fast access to last 100 captured requests
- **Request Copy as cURL** - Export requests as executable cURL commands (optional)

## Screenshots

> Screenshots placeholder - Dashboard view will show:
> - Real-time request list with filtering
> - Request detail view with headers, body, and metadata
> - Live streaming updates

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     HTTP Request Tracker                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Client (Next.js Browser)                                    │
│  ├─ Dashboard UI (React)                                     │
│  └─ Socket.IO Client Connection                              │
│                          ▲                                    │
│                          │ WebSocket (Socket.IO)             │
│                          ▼                                    │
│  Next.js Server                                              │
│  ├─ API Route: POST /api/core                                │
│  │  └─ Validates API_KEY                                     │
│  │  └─ Stores request in in-memory store                     │
│  │  └─ Emits Socket.IO events to connected clients           │
│  │                                                            │
│  ├─ Dashboard Route: GET /                                   │
│  │  └─ Protected by Basic Auth + IP Allowlist                │
│  │                                                            │
│  ├─ Middleware                                               │
│  │  └─ Authentication & Authorization checks                 │
│  │                                                            │
│  └─ In-Memory Request Store                                  │
│     └─ Circular buffer (max 100 requests)                    │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Incoming Request** → POST `/api/core` with API_KEY header
2. **Validation** → Middleware validates API key and IP allowlist
3. **Storage** → Request data stored in circular in-memory buffer
4. **Broadcast** → Socket.IO emits `request_received` event
5. **Display** → Connected dashboard clients receive live updates

## Tech Stack

### Framework
- **Next.js 14+** (App Router) - Modern full-stack React framework with built-in API routes and middleware

### Language
- **TypeScript** - Type-safe development with full IDE support

### Real-time Communication
- **Socket.IO** - Bi-directional real-time communication between server and clients

### UI & Styling
- **shadcn/ui** - High-quality, accessible React components
- **TailwindCSS** - Utility-first CSS framework for rapid styling

### State Management
- **In-Memory Store** - Simple, fast circular buffer for request storage (no database required)

### Security
- **API Key Authentication** - Simple header-based authentication for `/api/core`
- **HTTP Basic Auth** - Optional username/password protection for dashboard
- **IP Allowlist** - Restrict dashboard access to specific IP addresses

## Installation

### Prerequisites
- Node.js 18+ 
- npm, yarn, or bun

### Setup

```bash
# Clone the repository
git clone <repository-url>
cd http-tracker

# Install dependencies (using bun for faster builds)
bun install

# Or using npm
npm install

# Copy environment variables
cp .env.example .env.local

# Generate API key (or use your own)
# Update .env.local with your configuration
```

## Running the Development Server

```bash
# Using bun
bun run dev

# Or using npm
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to access the dashboard.

The application will be available at:
- **Dashboard**: http://localhost:3000
- **Capture API**: http://localhost:3000/api/core

### Testing the API

```bash
# Send a test request
curl -X POST http://localhost:3000/api/core \
  -H "API-Key: your-api-key-here" \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

## Running in Production

### Build

```bash
# Using bun
bun run build

# Or using npm
npm run build
```

### Start Production Server

```bash
# Using bun
bun start

# Or using npm
NODE_ENV=production npm start
```

### Environment Setup

Ensure all required environment variables are configured (see [Environment Variables Documentation](./docs/ENVIRONMENT.md)).

### Recommended Configurations

- **Reverse Proxy**: Use Nginx or similar for SSL/TLS termination
- **Process Manager**: Use PM2 or systemd for process management
- **Docker**: Deploy using Docker for consistency across environments
- **Logging**: Monitor application logs for debugging

## Configuration

See [Environment Variables Documentation](./docs/ENVIRONMENT.md) for complete configuration options.

Key variables:
- `API_KEY` - Authentication key for `/api/core`
- `ALLOWLIST_IPS` - Comma-separated list of allowed IPs for dashboard
- `BASIC_AUTH_USER` - Optional dashboard username
- `BASIC_AUTH_PASS` - Optional dashboard password

## Documentation

- [Tech Stack](./docs/TECH_STACK.md) - Framework and tool guides with examples
- [Backend Implementation](./docs/BACKEND.md) - Backend components and API endpoints
- [Architecture Overview](./docs/ARCHITECTURE.md) - Detailed system design and components
- [API Reference](./docs/API_REFERENCE.md) - Endpoints, data structures, and WebSocket events
- [Environment Variables](./docs/ENVIRONMENT.md) - Configuration guide
- [Folder Structure](./docs/FOLDER_STRUCTURE.md) - Project organization guide

## Project Structure

```
http-tracker/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard pages
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles
├── components/            # React components
├── lib/                   # Utilities and business logic
├── types/                 # TypeScript type definitions
├── public/                # Static assets
└── docs/                  # Documentation
```

See [Folder Structure Guide](./docs/FOLDER_STRUCTURE.md) for detailed breakdown.

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see LICENSE file for details

## Support

For issues, questions, or suggestions, please open an issue on GitHub.
