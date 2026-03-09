# Project Folder Structure

This document explains the recommended folder organization for the HTTP Request Tracker project.

## Directory Overview

```
http-tracker/                          # Project root
├── .gitignore                        # Git ignore rules
├── .env.example                      # Environment variables template
├── .env.local                        # Local environment (git-ignored)
├── package.json                      # Project dependencies and scripts
├── package-lock.json                 # Dependency lock file
├── tsconfig.json                     # TypeScript configuration
├── next.config.ts                    # Next.js configuration
├── postcss.config.mjs                # Tailwind/PostCSS configuration
├── eslint.config.mjs                 # ESLint configuration
├── README.md                         # Main project documentation
│
├── app/                              # Next.js App Directory
│   ├── layout.tsx                    # Root layout (HTML, providers, metadata)
│   ├── page.tsx                      # Home page (redirects to dashboard)
│   ├── globals.css                   # Global styles
│   ├── favicon.ico                   # Favicon
│   │
│   ├── dashboard/                    # Dashboard route group
│   │   ├── layout.tsx                # Dashboard layout (auth wrapper)
│   │   └── page.tsx                  # Dashboard UI
│   │
│   └── api/                          # API routes
│       ├── core/                     # Request capture endpoint
│       │   └── route.ts              # POST /api/core handler
│       │
│       └── requests/                 # Request management endpoints
│           ├── route.ts              # GET /api/requests, DELETE all
│           └── [id]/
│               └── route.ts          # DELETE /api/requests/[id]
│
├── components/                       # React components
│   ├── Providers.tsx                 # Context/Provider wrapper
│   ├── ErrorBoundary.tsx             # Error boundary component
│   │
│   ├── dashboard/                    # Dashboard-specific components
│   │   ├── DashboardLayout.tsx       # Main dashboard layout
│   │   ├── RequestList.tsx           # Request list panel
│   │   ├── RequestDetail.tsx         # Request detail panel
│   │   ├── RequestActions.tsx        # Action buttons (delete, copy)
│   │   ├── CopyAsButton.tsx          # Copy as cURL button
│   │   ├── DeleteButton.tsx          # Delete single request
│   │   ├── ClearAllButton.tsx        # Delete all requests
│   │   ├── EmptyState.tsx            # Empty list message
│   │   └── LoadingState.tsx          # Loading skeleton
│   │
│   └── common/                       # Reusable components
│       ├── Header.tsx                # Application header
│       ├── Footer.tsx                # Application footer
│       ├── Spinner.tsx               # Loading spinner
│       ├── Badge.tsx                 # Badge component
│       └── CodeBlock.tsx             # Code display with syntax highlighting
│
├── lib/                              # Business logic and utilities
│   ├── socket.ts                     # Socket.IO server initialization
│   ├── socket-client.ts              # Socket.IO client hooks
│   ├── requestStore.ts               # In-memory request storage
│   ├── requestParser.ts              # Request data extraction
│   ├── auth.ts                       # Authentication utilities
│   ├── middleware.ts                 # Middleware functions
│   ├── apiClient.ts                  # HTTP client utilities
│   │
│   ├── validators/                   # Input validation
│   │   ├── apiKey.ts                 # Validate API key format
│   │   ├── ip.ts                     # Validate IP addresses
│   │   └── headers.ts                # Validate request headers
│   │
│   └── utils/                        # General utilities
│       ├── curl.ts                   # cURL generation
│       ├── formatting.ts             # Format dates, JSON, etc.
│       ├── logger.ts                 # Logging utility
│       └── constants.ts              # Application constants
│
├── types/                            # TypeScript type definitions
│   ├── index.ts                      # Re-export all types
│   ├── requests.ts                   # Request-related types
│   ├── socket.ts                     # Socket.IO event types
│   ├── api.ts                        # API response types
│   └── env.d.ts                      # Environment variable types
│
├── middleware.ts                     # Next.js middleware (auth/logging)
│
├── public/                           # Static assets
│   ├── favicon.ico                   # Favicon
│   ├── logo.svg                      # Logo
│   └── logo-dark.svg                 # Dark mode logo
│
├── docs/                             # Documentation
│   ├── ARCHITECTURE.md               # System architecture
│   ├── API_REFERENCE.md              # API endpoints and data structures
│   ├── ENVIRONMENT.md                # Environment variables
│   ├── FOLDER_STRUCTURE.md           # This file
│   ├── DEVELOPMENT.md                # Development guide (optional)
│   └── DEPLOYMENT.md                 # Deployment guide (optional)
│
├── scripts/                          # Build and utility scripts
│   └── generate-api-key.js           # Generate random API key
│
├── __tests__/                        # Jest test files (optional)
│   ├── api/
│   │   └── core.test.ts              # API endpoint tests
│   ├── lib/
│   │   ├── requestStore.test.ts      # Store logic tests
│   │   └── requestParser.test.ts     # Parser tests
│   └── utils/
│       └── curl.test.ts              # cURL generation tests
│
└── .vscode/                          # VS Code settings (optional)
    ├── settings.json                 # Project-specific VS Code settings
    ├── launch.json                   # Debug configuration
    └── extensions.json               # Recommended extensions
```

## Detailed Directory Descriptions

### `/app` - Next.js App Directory

**Purpose:** Contains all routes and page components using Next.js App Router.

**Key Files:**
- `layout.tsx` - Root layout wraps all pages with shared HTML/providers
- `page.tsx` - Home page, typically redirects to `/dashboard`
- `globals.css` - Global styles applied to entire application

**Subdirectories:**
- `dashboard/` - Protected dashboard routes
- `api/` - API route handlers

**Pattern:** Each route has:
- `page.tsx` - The actual page component
- `layout.tsx` - Optional layout wrapper
- Other local components as needed

### `/app/api` - API Routes

**Purpose:** Server-side API endpoints callable from frontend or external systems.

**Structure:**
```
/app/api/
├── core/route.ts                # POST /api/core (capture requests)
└── requests/
    ├── route.ts                 # GET /api/requests, DELETE /api/requests
    └── [id]/route.ts            # DELETE /api/requests/:id
```

**Conventions:**
- Each subdirectory = one API endpoint
- `route.ts` contains all HTTP methods for that endpoint
- Use `route.get()`, `route.post()`, etc. exports

### `/components` - React Components

**Purpose:** Reusable UI components using React.

**Organization:**
- `dashboard/` - Dashboard-specific components
- `common/` - Shared components used across pages

**Conventions:**
- One component per file
- File should match component name (PascalCase)
- Keep components small and focused
- Props interfaces defined in same file or `types/`

### `/lib` - Business Logic

**Purpose:** Non-UI logic, utilities, and helper functions.

**Key Modules:**

**socket.ts**
- Initialize Socket.IO server
- Register event handlers
- Manage connections

**socket-client.ts**
- React hooks for Socket.IO client
- Example: `useSocket()`, `useRequest()`

**requestStore.ts**
- Circular buffer implementation
- In-memory request storage
- CRUD operations

**requestParser.ts**
- Extract data from raw requests
- Normalize headers
- Parse bodies
- Detect IPs

**auth.ts**
- Validate API keys
- Check Basic Auth
- IP allowlist checking

**middleware.ts**
- Combine auth checks
- Logging middleware
- Error handling

**Subdirectories:**
- `validators/` - Input validation logic
- `utils/` - General utility functions

### `/types` - TypeScript Definitions

**Purpose:** Centralized TypeScript type definitions.

**Key Files:**
- `requests.ts` - `CapturedRequest`, `RequestPayload` types
- `socket.ts` - Socket.IO event payload types
- `api.ts` - API response types
- `env.d.ts` - Environment variable types

**Conventions:**
- Export types from `index.ts` for easy imports
- Keep types close to where they're used if they're specific
- Define common types here for shared usage

### `/public` - Static Assets

**Purpose:** Files served directly by Next.js without processing.

**Contents:**
- Images (SVG, PNG, etc.)
- Icons and favicons
- Static JSON files
- Other static resources

**Access:** Files accessible at `/_next/static/` in URLs

### `/docs` - Documentation

**Purpose:** Project documentation and guides.

**Key Files:**
- `README.md` - Main project overview (in root, but documented here)
- `ARCHITECTURE.md` - System design and architecture
- `API_REFERENCE.md` - API endpoints and data structures
- `ENVIRONMENT.md` - Environment variables guide
- `FOLDER_STRUCTURE.md` - This document
- `DEVELOPMENT.md` - Developer setup and workflow
- `DEPLOYMENT.md` - Production deployment guide

### `/scripts` - Build and Utility Scripts

**Purpose:** Node.js scripts for development and production tasks.

**Examples:**
- `generate-api-key.js` - Generate secure API keys
- Database migration scripts (if added)
- Data cleanup scripts

**Run:** `node scripts/filename.js`

### `/__tests__` - Test Files

**Purpose:** Jest unit and integration tests.

**Structure:** Mirror src structure
```
__tests__/
├── api/          # Test API routes
├── lib/          # Test business logic
├── components/   # Test React components
└── utils/        # Test utility functions
```

## File Naming Conventions

### Components (React)

- **Files:** PascalCase.tsx
- **Exports:** Named exports
- **Example:** `RequestList.tsx` exports `RequestList` component

```typescript
// components/dashboard/RequestList.tsx
export function RequestList() {
  // ...
}

export interface RequestListProps {
  // ...
}
```

### Types

- **Files:** lowercase-with-hyphens.ts
- **Exports:** Named exports
- **Example:** `requests.ts` exports `CapturedRequest` type

```typescript
// types/requests.ts
export interface CapturedRequest {
  // ...
}

export type RequestMethod = 'GET' | 'POST' | ...;
```

### Utilities

- **Files:** camelCase.ts
- **Exports:** Named exports (optional default)
- **Example:** `curl.ts` exports `generateCurlCommand`

```typescript
// lib/utils/curl.ts
export function generateCurlCommand(request: CapturedRequest): string {
  // ...
}
```

### API Routes

- **Files:** `route.ts` (not `index.ts`)
- **Exports:** Named exports for HTTP methods
- **Example:** `app/api/core/route.ts`

```typescript
// app/api/core/route.ts
export async function POST(request: NextRequest) {
  // ...
}

export async function GET(request: NextRequest) {
  // ...
}
```

## Import Paths

### Absolute Imports

Configure in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### Usage

```typescript
// ✅ Good - absolute imports
import { RequestList } from '@/components/dashboard/RequestList';
import { CapturedRequest } from '@/types/requests';
import { requestStore } from '@/lib/requestStore';

// ❌ Avoid - relative imports
import { RequestList } from '../../../components/dashboard/RequestList';
```

## Dependency Graph

```
components/           (depends on)
├── types/
├── lib/
└── lib/utils/

pages/               (depends on)
├── components/
├── types/
├── lib/
└── lib/socket-client/

lib/socket.ts        (depends on)
├── types/
└── lib/requestStore/

app/api/             (depends on)
├── types/
├── lib/
└── lib/requestStore/
```

## Adding New Features

### Adding a New Component

1. Create file in `components/` subdirectory:
   ```
   components/dashboard/MyNewComponent.tsx
   ```

2. Define component and props interface:
   ```typescript
   export interface MyNewComponentProps {
     // ...
   }

   export function MyNewComponent(props: MyNewComponentProps) {
     // ...
   }
   ```

3. Use in parent component:
   ```typescript
   import { MyNewComponent } from '@/components/dashboard/MyNewComponent';
   ```

### Adding a New API Endpoint

1. Create directory structure:
   ```
   app/api/my-endpoint/route.ts
   ```

2. Implement handler:
   ```typescript
   export async function POST(request: NextRequest) {
     // ...
   }
   ```

3. Document in `/docs/API_REFERENCE.md`

### Adding a New Utility

1. Create file in `lib/utils/`:
   ```
   lib/utils/my-utility.ts
   ```

2. Export functions:
   ```typescript
   export function myFunction() {
     // ...
   }
   ```

3. Use in components:
   ```typescript
   import { myFunction } from '@/lib/utils/my-utility';
   ```

### Adding Types

1. Add to appropriate `types/` file or create new one
2. Export from `types/index.ts`
3. Use with `import type { MyType } from '@/types'`

## Common Tasks and File Locations

| Task | File Location |
|------|---|
| Add new API endpoint | `app/api/[endpoint]/route.ts` |
| Add dashboard component | `components/dashboard/[Name].tsx` |
| Add utility function | `lib/utils/[name].ts` |
| Add type definition | `types/[domain].ts` |
| Add Socket.IO event | `types/socket.ts` + `lib/socket.ts` |
| Configure environment variable | `.env.example` + `types/env.d.ts` |
| Add new page | `app/[route]/page.tsx` |
| Write test | `__tests__/[path]/[name].test.ts` |
| Add documentation | `docs/[topic].md` |

## Best Practices

### ✅ DO

- **Keep components small** - One responsibility per component
- **Use absolute imports** - Easier refactoring and readability
- **Co-locate types** - Keep types close to where they're used
- **Separate concerns** - UI in `/components`, logic in `/lib`
- **Document complex modules** - Add JSDoc comments
- **Use consistent naming** - Files, folders, and exports follow conventions

### ❌ DON'T

- **Mix concerns** - Don't put business logic in components
- **Use index.ts files** - Explicit filename shows what's inside
- **Create deeply nested folders** - Max 3-4 levels deep
- **Store unrelated logic** - Keep utilities organized by domain
- **Violate naming conventions** - Use PascalCase for components, camelCase for utilities

## Performance Considerations

### Code Splitting

- Automatic via Next.js for routes
- Manual via `dynamic()` for large components
- Consider for components not needed on first render

### Bundle Size

- Monitor in `next/bundle-analyzer`
- Keep `/lib` functions pure (easier to tree-shake)
- Avoid large dependencies in critical paths

### Search Path Optimization

- Use specific imports: `import { Component } from '@/components/specific'`
- Avoid wildcard imports: `import * as components from '@/components'`
- IDE will auto-complete paths efficiently
