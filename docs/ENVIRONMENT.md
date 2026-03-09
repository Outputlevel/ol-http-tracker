# Environment Variables

This document describes all environment variables used by the HTTP Request Tracker.

## Configuration File

Environment variables are loaded from:
- `.env.local` - Development (recommended)
- `.env.production.local` - Production
- `.env` - Fallback (not recommended for secrets)

## Required Variables

### API_KEY

**Type:** String  
**Required:** Yes  
**Default:** None

The API key used to authenticate requests sent to `/api/core`.

**Requirements:**
- Minimum 12 characters
- Recommended: 32+ alphanumeric characters
- Should be cryptographically random

**Example:**
```bash
API_KEY=your-secret-api-key-32-characters-minimum-length
```

**Usage:**

```bash
curl -X POST http://localhost:3000/api/core \
  -H "API-Key: your-secret-api-key-32-characters-minimum-length" \
  -H "Content-Type: application/json" \
  -d '{"event": "test"}'
```

---

## Optional Variables

### ALLOWLIST_IPS

**Type:** String (comma-separated)  
**Required:** No  
**Default:** Empty (all IPs allowed)

Comma-separated list of IP addresses or CIDR ranges allowed to access the dashboard.

**Format:**
```bash
ALLOWLIST_IPS=203.0.113.0,192.0.2.1,198.51.100.0/24
```

**Examples:**

Single IP:
```bash
ALLOWLIST_IPS=192.168.1.100
```

Multiple IPs:
```bash
ALLOWLIST_IPS=203.0.113.0,192.0.2.1,198.51.100.5
```

CIDR ranges:
```bash
ALLOWLIST_IPS=192.168.0.0/16,10.0.0.0/8,172.16.0.0/12
```

Mixed:
```bash
ALLOWLIST_IPS=203.0.113.50,192.168.1.0/24,10.0.0.1
```

**Behavior:**
- If empty or undefined, all IPs are allowed
- Tab/space separated lists will be split automatically
- Invalid entries are logged as warnings and skipped
- Supports IPv4 and IPv6 addresses
- Supports CIDR notation for IP ranges

**Header Detection:**
The application respects proxy headers for IP detection:
- `X-Forwarded-For` (primary)
- `X-Real-IP` (fallback)
- `CF-Connecting-IP` (Cloudflare)
- Direct connection IP (final fallback)

---

### BASIC_AUTH_USER

**Type:** String  
**Required:** Only if `BASIC_AUTH_PASS` is set  
**Default:** Empty (auth disabled)

Username for HTTP Basic Authentication on dashboard access.

**Requirements:**
- Minimum 3 characters
- No spaces or special characters (except underscore, hyphen)
- Should be simple and memorable
- NOT the same as password

**Example:**
```bash
BASIC_AUTH_USER=admin
```

**Note:** Must be used together with `BASIC_AUTH_PASS`. If only one is set, both are ignored.

---

### BASIC_AUTH_PASS

**Type:** String  
**Required:** Only if `BASIC_AUTH_USER` is set  
**Default:** Empty (auth disabled)

Password for HTTP Basic Authentication on dashboard access.

**Requirements:**
- Minimum 8 characters recommended
- Can contain letters, numbers, and special characters
- Recommended: Cryptographically random or strong passphrase
- MUST NOT be committed to version control

**Example:**
```bash
BASIC_AUTH_PASS=secure_password_12345
```

**Warning:** This is transmitted in the HTTP Authorization header. ALWAYS use HTTPS in production.

**Note:** Must be used together with `BASIC_AUTH_USER`. If only one is set, both are ignored.

---

## Optional Feature Flags

### NODE_ENV

**Type:** String  
**Required:** No  
**Default:** `development`  
**Valid Values:** `development`, `production`, `test`

Determines application behavior and optimization level.

```bash
# Development - verbose logging, hot reload
NODE_ENV=development

# Production - optimized builds, minimal logging
NODE_ENV=production
```

---

### DEBUG

**Type:** String  
**Required:** No  
**Default:** Empty

Enable debug logging for specific modules.

```bash
# Enable all debug logs
DEBUG=*

# Enable specific modules
DEBUG=socket.io:client,http-tracker:auth

# Disable specific modules
DEBUG=*,-socket.io:parser
```

---

## Example Configuration Files

### .env.local (Development)

```bash
# Required
API_KEY=sk_dev_test123456789abcdefghijklmnop

# Optional - Development may allow all IPs
# ALLOWLIST_IPS=

# Optional - Usually disabled in development
# BASIC_AUTH_USER=
# BASIC_AUTH_PASS=

# Node environment
NODE_ENV=development

# Optional - Enable debugging
DEBUG=http-tracker:*
```

### .env.production.local (Production)

```bash
# Required - Strong API key
API_KEY=sk_live_$(openssl rand -hex 32)

# Highly recommended - restrict dashboard access
ALLOWLIST_IPS=203.0.113.0,192.168.1.0/24,10.0.0.5

# Recommended - protect dashboard
BASIC_AUTH_USER=admin
BASIC_AUTH_PASS=ChangeMe@SecurePassword123!

# Node environment
NODE_ENV=production

# Optional - Disable or limit debug logs
# DEBUG=http-tracker:warn
```

### .env.example (Template)

```bash
# ============================================
# REQUIRED VARIABLES
# ============================================

# API key for POST /api/core endpoint
# Generate: openssl rand -hex 32
API_KEY=your-api-key-here

# ============================================
# OPTIONAL SECURITY VARIABLES
# ============================================

# Comma-separated list of allowed IPs for dashboard
# Format: single IPs, CIDR ranges, or mix of both
# Example: 192.168.1.0/24,10.0.0.5,203.0.113.0
# Leave empty to allow all IPs
ALLOWLIST_IPS=

# HTTP Basic Auth username (requires BASIC_AUTH_PASS)
BASIC_AUTH_USER=

# HTTP Basic Auth password (requires BASIC_AUTH_USER)
BASIC_AUTH_PASS=

# ============================================
# OPTIONAL SYSTEM VARIABLES
# ============================================

# Node environment (development, production, test)
NODE_ENV=development

# Debug logging enable specific modules
DEBUG=
```

---

## Setting Variables by Environment

### Local Development

**Option 1: .env.local file**
```bash
echo 'API_KEY=sk_dev_test123456789abcdefghijklmnop' > .env.local
echo 'NODE_ENV=development' >> .env.local
```

**Option 2: Export before running**
```bash
export API_KEY=sk_dev_test123456789abcdefghijklmnop
bun run dev
# Or using npm
npm run dev
```

**Option 3: Inline with command**
```bash
API_KEY=sk_dev_test123456789abcdefghijklmnop bun run dev
# Or using npm
API_KEY=sk_dev_test123456789abcdefghijklmnop npm run dev
```

### Docker/Container

```dockerfile
ENV API_KEY=sk_live_abc123xyz789
ENV ALLOWLIST_IPS=0.0.0.0/0
ENV BASIC_AUTH_USER=admin
ENV BASIC_AUTH_PASS=password123
```

Or use `.env` file mounted as volume:
```bash
docker run -v $(pwd)/.env:/app/.env http-tracker:latest
```

### Environment-Specific Overrides

Next.js automatically loads files in this order (later overrides earlier):
```
.env
.env.local
.env.[NODE_ENV]
.env.[NODE_ENV].local
```

Example setup:
```
.env                    # Shared defaults
.env.local              # Local overrides (git-ignored)
.env.production         # Production defaults
.env.production.local   # Production secrets (git-ignored)
```

---

## Validation

The application validates environment variables on startup:

### Warnings (Non-blocking)
- Missing optional security settings
- Invalid IP format in ALLOWLIST_IPS
- Basic Auth only partially configured

### Errors (Blocking)
- Missing API_KEY
- Invalid NODE_ENV value

### Log Output

Environment validation logs:
```
[INFO] Environment validation
[WARN] No API allowlist configured - all IPs allowed
[WARN] No basic auth configured - dashboard is public
[INFO] Environment: production
[INFO] API endpoint: /api/core
[OK] All required variables set
```

---

## Security Best Practices

### ✅ DO

- **Generate strong API keys** - Use cryptographic randomness
  ```bash
  # macOS/Linux
  openssl rand -hex 32
  
  # Node.js
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  
  # Python
  python3 -c "import secrets; print(secrets.token_hex(32))"
  ```

- **Store secrets in `.env.local`** - Never commit to git
- **Use HTTPS in production** - Required for Basic Auth
- **Rotate API keys regularly** - Implement key versioning
- **Restrict IP access** - Use ALLOWLIST_IPS in production
- **Use complex passwords** - If enabling Basic Auth
- **Monitor environment variables** - Log what's being loaded

### ❌ DON'T

- **Hardcode secrets** - Use environment variables
- **Use weak API keys** - Minimum 12 characters, preferably 32+
- **Commit `.env.local`** - Add to `.gitignore`
- **Use identical dev and prod keys** - Generate unique keys per environment
- **Transmit credentials unencrypted** - Always use HTTPS in production
- **Share credentials** - Each team member gets unique keys
- **Use default passwords** - Always change defaults

---

## Generating Secure Values

### API Key Generation

```bash
# OpenSSL (all platforms)
openssl rand -hex 32

# Node.js  
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Python 3
python3 -c "import secrets; print(secrets.token_hex(32))"

# PowerShell
[Convert]::ToHexString([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

### Password Generation

```bash
# OpenSSL
openssl rand -base64 32

# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Python 3
python3 -c "import secrets; print(secrets.token_urlsafe(32))"

# PowerShell
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

---

## Troubleshooting

### "Missing API-Key header" Error

**Problem:** All requests to `/api/core` return 401 Unauthorized

**Solutions:**
1. Verify `API_KEY` is set in `.env.local`
2. Verify header name is exactly `API-Key` (case-sensitive)
3. Verify there are no extra spaces in the key
4. Restart development server after changing `.env.local`

```bash
# Test your API key
curl -X POST http://localhost:3000/api/core \
  -H "API-Key: your-actual-key-value" \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

### "Your IP address is not allowed" Error

**Problem:** Dashboard returns 403 when accessing from localhost

**Solutions:**
1. Check if `ALLOWLIST_IPS` is set
2. Verify your IP is in the list
3. Check if proxy headers are being used (X-Forwarded-For)
4. Log your current IP and add it to the list

```bash
# Find your IP
curl http://localhost:3000/api/ip

# Add to allowlist
ALLOWLIST_IPS=127.0.0.1,192.168.1.100
```

### Variables Not Loading

**Problem:** Changes to `.env.local` not taking effect

**Solutions:**
1. Make sure file is named `.env.local` (not `.env`)
2. Restart development server: `bun run dev` or `npm run dev`
3. Check file is in project root directory
4. Verify no syntax errors in `.env.local`

**Valid format:**
```bash
KEY=value
KEY="value with spaces"
KEY=value # comment is allowed
```

**Invalid format:**
```bash
 KEY=value   # Leading space breaks it
KEY =value   # Space around = breaks it
KEY: value   # Use = not :
```

### Production Deployment Not Reading Variables

**Problem:** Environment variables set correctly locally but not in production

**Solutions:**
1. Verify variables are set in production environment
2. Check if using wrong `.env` file name
3. Verify application restart after changing variables
4. Check for conflicting environment variables
5. Review application logs during startup

```bash
# Check if variables are available
echo $API_KEY
echo $ALLOWLIST_IPS

# Restart application to load new variables (using bun)
bun run build
bun start

# Or using npm
npm run build
npm start
```

---

## Reference

### Quick Copy-Paste Template

```bash
# For development
cat > .env.local << EOF
API_KEY=sk_dev_$(openssl rand -hex 16)
NODE_ENV=development
EOF

# For production
cat > .env.production.local << EOF
API_KEY=sk_live_$(openssl rand -hex 32)
ALLOWLIST_IPS=0.0.0.0/0
BASIC_AUTH_USER=admin
BASIC_AUTH_PASS=$(openssl rand -base64 32)
NODE_ENV=production
EOF
```

### Environment Variable Checklist

- [ ] API_KEY generated and set
- [ ] .env.local created and git-ignored
- [ ] ALLOWLIST_IPS configured (if restricting access)
- [ ] BASIC_AUTH_USER and BASIC_AUTH_PASS set (if needed)
- [ ] NODE_ENV set appropriately
- [ ] Development server restarted after changes
- [ ] Production deployment uses production variables
- [ ] No secrets committed to version control
- [ ] All required variables validated on startup
