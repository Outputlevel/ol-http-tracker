/**
 * HTTP Basic Authentication Implementation Guide
 * 
 * This document describes how HTTP Basic Authentication is implemented
 * for protecting the dashboard in the HTTP Request Tracker application.
 */

# HTTP Basic Authentication for Dashboard

## Overview

The dashboard is protected with HTTP Basic Authentication using middleware. The implementation supports:

- **Conditional authentication** - Authentication can be enabled/disabled via environment variable
- **IP allowlist** - Trusted IPs bypass authentication (single IPs and CIDR notation)
- **Basic Auth fallback** - Non-allowlisted IPs must provide username/password
- **Secure credential validation** - Timing-safe comparison prevents timing attacks

## Architecture

### Middleware Flow

```
Request to /dashboard/*
        ▼
┌─────────────────────────────────────────┐
│ Check HTTP_BASIC_AUTH env variable      │
└─────────────────────────────────────────┘
   │
   ├─ Not set or false → ALLOW (bypass auth)
   │
   └─ true → Continue to IP check
       ▼
┌─────────────────────────────────────────┐
│ Get client IP address                   │
│ (respects X-Forwarded-For, etc.)        │
└─────────────────────────────────────────┘
       ▼
┌─────────────────────────────────────────┐
│ Check IP in ALLOWLIST_IPS               │
└─────────────────────────────────────────┘
   │
   ├─ IP is allowlisted → ALLOW
   │
   └─ IP not allowlisted → Require Auth
       ▼
┌─────────────────────────────────────────┐
│ Check for Authorization header          │
│ Format: "Basic <base64(user:pass)>"     │
└─────────────────────────────────────────┘
   │
   ├─ Missing/invalid → 401 Unauthorized
   │   (with WWW-Authenticate header)
   │
   └─ Present → Validate credentials
       ▼
┌─────────────────────────────────────────┐
│ Compare against BASIC_AUTH_USER and     │
│ BASIC_AUTH_PASS environment variables   │
└─────────────────────────────────────────┘
   │
   ├─ Match → ALLOW
   │
   └─ No match → 401 Unauthorized
```

## Configuration

### Environment Variables

```bash
# Enable HTTP Basic Authentication (required to enable dashboard protection)
HTTP_BASIC_AUTH=true

# IP Allowlist (optional - supports CIDR notation)
# If set, these IPs bypass authentication
ALLOWLIST_IPS=127.0.0.1,192.168.1.20,192.168.0.0/24

# Basic Auth credentials (required when HTTP_BASIC_AUTH=true)
BASIC_AUTH_USER=admin
BASIC_AUTH_PASS=supersecret
```

### Detailed Configuration

#### HTTP_BASIC_AUTH
- **Type**: Boolean (true/false string)
- **Default**: Not set / false
- **Effect**: 
  - If `true`: Enable middleware authentication for `/dashboard/*` routes
  - If not set or any other value: Bypass authentication completely

#### ALLOWLIST_IPS
- **Type**: Comma-separated list
- **Format**: IPv4 addresses or CIDR notation
- **Examples**:
  - Single IP: `127.0.0.1`
  - Multiple IPs: `192.168.1.1,192.168.1.2`
  - CIDR range: `192.168.0.0/24` (includes 192.168.0.1 to 192.168.0.254)
  - Mixed: `127.0.0.1,192.168.0.0/24,10.0.0.5`

#### BASIC_AUTH_USER & BASIC_AUTH_PASS
- **Type**: String
- **Requirements**: Both must be set when `HTTP_BASIC_AUTH=true`
- **Security**: Don't use default values in production
- **Encoding**: Credentials are Base64 encoded in HTTP header

## Protected Routes

Only dashboard routes are protected:
- `/dashboard` - Protected
- `/dashboard/requests` - Protected
- `/dashboard/settings` - Protected

API routes remain unprotected:
- `/api/core` - Uses API key auth (not Basic Auth)
- `/api/requests` - Unprotected
- `/socket.io` - Unprotected

## HTTP Basic Authentication Flow

### Step 1: Client Sends Request

```http
GET /dashboard HTTP/1.1
Host: localhost:3000
```

### Step 2: Server Checks IP

- Gets client IP from: `X-Forwarded-For`, `X-Real-IP`, `CF-Connecting-IP`, or socket
- Checks if IP is in `ALLOWLIST_IPS`

### Step 3a: IP Allowlisted

If IP is in allowlist:
```http
HTTP/1.1 200 OK
(Dashboard content)
```

### Step 3b: IP Not Allowlisted - No Credentials

If IP not in allowlist and no Authorization header:
```http
HTTP/1.1 401 Unauthorized
WWW-Authenticate: Basic realm="Dashboard Access"
```

Browser displays native login dialog:
```
Please authenticate.
Realm: Dashboard Access
Username: [          ]
Password: [          ]
```

### Step 3c: IP Not Allowlisted - With Credentials

Client sends credentials:
```http
GET /dashboard HTTP/1.1
Host: localhost:3000
Authorization: Basic YWRtaW46c3VwZXJzZWNyZXQ=
```

Note: `YWRtaW46c3VwZXJzZWNyZXQ=` is Base64 for `admin:supersecret`

### Step 4: Server Validates Credentials

- Decode Base64: `admin:supersecret`
- Extract username and password
- Compare against `BASIC_AUTH_USER` and `BASIC_AUTH_PASS`
- Return 200 OK or 401 Unauthorized

## Implementation Files

### Middleware (`middleware.ts`)

- Runs on all requests to `/dashboard/*`
- Implements authentication flow
- Returns 401 with `WWW-Authenticate` header when auth required
- Logs all authentication decisions

**Key logic**:
```typescript
1. Check if HTTP_BASIC_AUTH === 'true'
   - If false/unset: Allow all requests
   
2. For authenticated paths:
   - Get client IP
   - Check IP allowlist
   - If allowed: Grant access
   - If not allowed: Require Basic Auth
   
3. For Basic Auth validation:
   - Check Authorization header
   - Decode Base64 credentials
   - Validate against env vars
   - Return 401 if invalid
```

### Auth Functions (`lib/auth.ts`)

Core functions:
- `validateApiKey()` - Validates API key for `/api/core`
- `validateBasicAuth()` - Validates Basic Auth credentials
- `isIpAllowed()` - Checks IP allowlist
- `getClientIpFromRequest()` - Gets client IP from headers

### Basic Auth Utilities (`lib/auth/basicAuth.ts`)

Helper functions for Basic Auth:
- `decodeBasicAuth()` - Decode Base64 credentials
- `encodeBasicAuth()` - Encode credentials as Base64
- `isBasicAuthFormat()` - Validate header format
- `validateCredentials()` - Compare with expected values
- `createWwwAuthenticateHeader()` - Generate WWW-Authenticate header

**Security**: Uses timing-safe string comparison to prevent timing attacks.

### IP Allowlist Utilities (`lib/auth/ipAllowlist.ts`)

Helper functions for IP validation:
- `parseAllowlist()` - Parse comma-separated list
- `matchesPattern()` - Check if IP matches pattern
- `isIpInCidr()` - Validate IP in CIDR range
- `ipToNumber()` - Convert IP to 32-bit number
- `isValidIPv4()` - Validate IP format
- `isValidCIDR()` - Validate CIDR format

## Testing

### Test 1: Authentication Disabled

```bash
# Set env variable to disable auth
HTTP_BASIC_AUTH=false

# Request should be allowed without credentials
curl -i http://localhost:3000/dashboard
# Expected: 200 OK (or dashboard content)
```

### Test 2: IP Allowlisted

```bash
# Configuration
HTTP_BASIC_AUTH=true
ALLOWLIST_IPS=127.0.0.1

# From allowed IP (localhost)
curl -i http://localhost:3000/dashboard
# Expected: 200 OK
```

### Test 3: IP Not Allowlisted - Missing Credentials

```bash
# Configuration
HTTP_BASIC_AUTH=true
ALLOWLIST_IPS=10.0.0.1  # Not localhost

# Request without credentials
curl -i http://localhost:3000/dashboard
# Expected: 401 Unauthorized
# Header: WWW-Authenticate: Basic realm="Dashboard Access"
```

### Test 4: IP Not Allowlisted - Valid Credentials

```bash
# Configuration
HTTP_BASIC_AUTH=true
ALLOWLIST_IPS=10.0.0.1
BASIC_AUTH_USER=admin
BASIC_AUTH_PASS=secret

# Encode credentials: echo -n "admin:secret" | base64
# Result: YWRtaW46c2VjcmV0

curl -i -H "Authorization: Basic YWRtaW46c2VjcmV0" \
  http://localhost:3000/dashboard
# Expected: 200 OK
```

### Test 5: IP Not Allowlisted - Invalid Credentials

```bash
# Configuration (same as Test 4 but wrong password)

# Encode wrong credentials: echo -n "admin:wrong" | base64
# Result: YWRtaW46d3Jvbmc=

curl -i -H "Authorization: Basic YWRtaW46d3Jvbmc=" \
  http://localhost:3000/dashboard
# Expected: 401 Unauthorized
```

### Test 6: CIDR Allowlist

```bash
# Configuration
HTTP_BASIC_AUTH=true
ALLOWLIST_IPS=192.168.1.0/24

# If your IP is 192.168.1.50, you're in range
# If your IP is 192.168.2.50, you need credentials

# Test from outside range:
curl -i -H "Authorization: Basic YWRtaW46c2VjcmV0" \
  http://example.com/dashboard
# Expected: 200 OK (if credentials valid)
```

## Security Considerations

### 1. Timing Attacks
- Uses constant-time comparison for credentials
- Prevents attacker from guessing password by timing response

### 2. Network Proxies
- Respects common proxy headers:
  - `X-Forwarded-For` (uses first IP)
  - `X-Real-IP`
  - `CF-Connecting-IP` (Cloudflare)
  - Socket IP (fallback)

### 3. Credential Transmission
- Always use HTTPS/TLS in production
- Basic Auth credentials are Base64 encoded, not encrypted
- Encoding can be easily decoded; use HTTPS to prevent interception

### 4. Password Storage
- Credentials stored in environment variables
- Don't commit `.env.local` or `.env.production.local` to version control
- Use `.env.example` for documentation

### 5. IP Spoofing
- If behind transparent proxy, verify `X-Forwarded-For` comes from trusted source
- Can be spoofed if proxy doesn't validate

## Troubleshooting

### "401 Unauthorized" for Allowlisted IP

**Possible causes**:
1. IP format mismatch (e.g., `127.0.0.1` vs `::1` for IPv6)
2. IP not actually in allowlist
3. Proxy headers not being respected

**Solutions**:
```bash
# Check your IP
curl -i http://localhost:3000/api/core -H "API-Key: test"
# (Look for client IP in response or logs)

# Update ALLOWLIST_IPS with your actual IP
ALLOWLIST_IPS=YOUR.ACTUAL.IP
```

### Browser Keeps Asking for Password

**Possible causes**:
1. Credentials being cached/incorrect
2. Realm name changed (forces re-authentication)

**Solutions**:
```bash
# Clear browser credentials
Ctrl+Shift+Delete → Clear browsing data (all time) → Deselect everything except "Passwords"

# Or use different browser/incognito
```

### Base64 Decoding Issues

**Encode credentials for header**:
```bash
# Linux/Mac
echo -n "admin:password" | base64

# PowerShell
[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes("admin:password"))

# Online tool: https://www.base64encode.org/
```

**Use with curl**:
```bash
# Option 1: Use curl's -u flag (curl encodes automatically)
curl -u admin:password http://localhost:3000/dashboard

# Option 2: Manual Base64 header
curl -H "Authorization: Basic YWRtaW46cGFzc3dvcmQ=" \
  http://localhost:3000/dashboard
```

## Advanced Configuration

### Multiple CIDR Ranges

```bash
ALLOWLIST_IPS=127.0.0.1,192.168.0.0/24,10.0.0.0/16,172.16.0.1
```

### Production Deployment

```bash
# .env.production.local
HTTP_BASIC_AUTH=true
ALLOWLIST_IPS=office.example.com,vpn.example.com  # Your network IPs
BASIC_AUTH_USER=secure_username
BASIC_AUTH_PASS=$(openssl rand -hex 32)  # Generate random password
```

### Disabling for Local Development

```bash
# .env.local (development)
HTTP_BASIC_AUTH=false
# No need to set BASIC_AUTH_USER or BASIC_AUTH_PASS
```

## Reference

### Environment Variable Checklist

- [ ] `HTTP_BASIC_AUTH` set correctly (true/false)
- [ ] `ALLOWLIST_IPS` has your IP(s)
- [ ] `BASIC_AUTH_USER` is alphanumeric
- [ ] `BASIC_AUTH_PASS` is strong
- [ ] No trailing spaces in values
- [ ] Variables loaded in .env.local
- [ ] Server restarted after changes

### HTTP Headers Reference

**Request**:
```
Authorization: Basic <base64(username:password)>
X-Forwarded-For: <client-ip>
```

**Response (on 401)**:
```
WWW-Authenticate: Basic realm="Dashboard Access"
Www-Authenticate: Basic realm="Custom Realm"
```

### Code Structure

```
lib/
├── auth.ts                 # Main auth functions
└── auth/
    ├── index.ts           # Export point
    ├── basicAuth.ts       # Basic Auth helpers
    └── ipAllowlist.ts     # IP validation helpers

middleware.ts             # Route protection
```
