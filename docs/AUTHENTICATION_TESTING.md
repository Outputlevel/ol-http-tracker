/**
 * HTTP Basic Authentication Testing Guide
 * 
 * This guide shows how to test the HTTP Basic Authentication
 * implementation for the dashboard.
 */

# Dashboard Authentication Testing Guide

## Quick Test Checklist

Use this checklist to verify authentication is working correctly.

### Prerequisites

- Application running with `bun run dev` or `npm run dev`
- curl installed (or Postman/REST client)
- PowerShell for Windows or terminal for Linux/Mac

## Test Scenarios

### Scenario 1: Authentication Disabled (Default)

**Configuration**:
```bash
HTTP_BASIC_AUTH=false
# or not set at all
```

**Expected Behavior**: All dashboard routes accessible without credentials

**Test**:
```bash
# Should return 200 OK
curl -i http://localhost:3000/dashboard
curl -i http://localhost:3000/dashboard/requests
```

**PowerShell**:
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/dashboard" -Method Get
# Status Code: 200
```

---

### Scenario 2: Authentication Enabled - Localhost Allowed

**Configuration**:
```bash
HTTP_BASIC_AUTH=true
ALLOWLIST_IPS=127.0.0.1
BASIC_AUTH_USER=admin
BASIC_AUTH_PASS=secret123
```

**Expected Behavior**: Localhost bypasses authentication

**Test**:
```bash
# Should return 200 OK without credentials
curl -i http://localhost:3000/dashboard
```

---

### Scenario 3: Authentication Enabled - Localhost Not Allowed

**Configuration**:
```bash
HTTP_BASIC_AUTH=true
ALLOWLIST_IPS=10.0.0.1
BASIC_AUTH_USER=admin
BASIC_AUTH_PASS=secret123
```

**Expected Behavior**: 
- Request without credentials returns 401
- Request with valid credentials returns 200

**Test Without Credentials**:
```bash
# Should return 401 Unauthorized
curl -i http://localhost:3000/dashboard

# Output should include:
# HTTP/1.1 401 Unauthorized
# WWW-Authenticate: Basic realm="Dashboard Access"
```

**PowerShell**:
```powershell
$response = Invoke-WebRequest -Uri "http://localhost:3000/dashboard" -Method Get
# Status Code: 401
$response.Headers['WWW-Authenticate']
# Output: Basic realm="Dashboard Access"
```

**Test With Credentials**:
```bash
# Using curl's -u flag (automatic Base64 encoding)
curl -i -u admin:secret123 http://localhost:3000/dashboard
# Should return 200 OK

# OR manually encode Base64
# Encode: echo -n "admin:secret123" | base64 → YWRtaW46c2VjcmV0MTIz
curl -i -H "Authorization: Basic YWRtaW46c2VjcmV0MTIz" \
  http://localhost:3000/dashboard
```

**PowerShell**:
```powershell
# Using -Credential flag
$cred = New-Object System.Management.Automation.PSCredential('admin', 
  (ConvertTo-SecureString 'secret123' -AsPlainText -Force))
Invoke-WebRequest -Uri "http://localhost:3000/dashboard" -Method Get -Credential $cred
# Status Code: 200

# OR manually encode Base64
$base64 = [Convert]::ToBase64String(
  [System.Text.Encoding]::UTF8.GetBytes("admin:secret123"))
$headers = @{ "Authorization" = "Basic $base64" }
Invoke-WebRequest -Uri "http://localhost:3000/dashboard" -Method Get -Headers $headers
# Status Code: 200
```

---

### Scenario 4: Authentication Enabled - Invalid Credentials

**Configuration**: (Same as Scenario 3)

**Expected Behavior**: Request rejected with 401

**Test**:
```bash
# Wrong password
curl -i -u admin:wrongpassword http://localhost:3000/dashboard
# Should return 401 Unauthorized

# Wrong username
curl -i -u wronguser:secret123 http://localhost:3000/dashboard
# Should return 401 Unauthorized

# Malformed Base64
curl -i -H "Authorization: Basic invalid!" http://localhost:3000/dashboard
# Should return 401 Unauthorized
```

---

### Scenario 5: CIDR Allowlist - IP In Range

**Configuration**:
```bash
HTTP_BASIC_AUTH=true
ALLOWLIST_IPS=192.168.1.0/24
BASIC_AUTH_USER=admin
BASIC_AUTH_PASS=secret123
```

**Expected Behavior**: 
- If client IP is 192.168.1.x: Access granted (bypasses auth)
- If client IP is not 192.168.1.x: Requires credentials

**How to Test**:
1. Find your actual IP:
   ```bash
   curl http://localhost:3000/api/core \
     -H "API-Key: test_key" \
     -H "Content-Type: application/json" \
     -d '{}' 2>&1 | head -20
   # Look for [Middleware] log or check ipconfig/ifconfig
   ```

2. Update `ALLOWLIST_IPS` accordingly

3. Test again:
   ```bash
   curl -i http://localhost:3000/dashboard
   ```

---

### Scenario 6: Multiple Allowlisted IPs

**Configuration**:
```bash
HTTP_BASIC_AUTH=true
ALLOWLIST_IPS=127.0.0.1,192.168.1.50,10.0.0.0/8
BASIC_AUTH_USER=admin
BASIC_AUTH_PASS=secret123
```

**Expected Behavior**: Any IP in list bypasses authentication

**Test**:
```bash
# Assumes you're on localhost (127.0.0.1)
curl -i http://localhost:3000/dashboard
# Should return 200 OK without credentials
```

---

### Scenario 7: Browser Authentication Dialog

**Configuration**:
```bash
HTTP_BASIC_AUTH=true
ALLOWLIST_IPS=10.0.0.1
BASIC_AUTH_USER=admin
BASIC_AUTH_PASS=secret123
```

**Steps**:
1. Start the application with `bun run dev`
2. Open browser: http://localhost:3000/dashboard
3. Browser should show authentication dialog:
   ```
   The site says: "Dashboard Access"
   
   Enter your username and password for this site.
   
   Username: [admin____________]
   Password: [secret123_______]
   
   [ ] Remember password for this site
   
   [Cancel] [OK]
   ```

4. Enter `admin` and `secret123`
5. Click OK - dashboard should load
6. Subsequent requests won't require credentials (cached)

7. To logout:
   - Close all browser tabs for localhost:3000
   - OR clear browser credentials:
     - Chrome/Edge: DevTools → Application → Cookies → Delete site data
     - Firefox: Preferences → Privacy & Security → Cookies and Site Data → Clear

---

## Testing via curl

### Helper Functions for Testing

**Encode credentials to Base64**:
```bash
# Using echo and base64
echo -n "admin:secret123" | base64

# Output: YWRtaW46c2VjcmV0MTIz
```

**PowerShell**:
```powershell
$text = "admin:secret123"
[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($text))
# Output: YWRtaW46c2VjcmV0MTIz
```

### curl Testing Examples

**Test 1: Check current IP**
```bash
# Check server logs (search for [Middleware] lines)
curl -i -H "API-Key: test" http://localhost:3000/api/core

# Or use external service
curl https://ifconfig.me
```

**Test 2: Test with quick commands**
```bash
# Without auth
curl -i http://localhost:3000/dashboard

# With curl's built-in auth encoding
curl -i -u admin:secret123 http://localhost:3000/dashboard

# With manual Base64 header
curl -i -H 'Authorization: Basic YWRtaW46c2VjcmV0MTIz' \
  http://localhost:3000/dashboard

# Without Basic Auth header (even if IP not allowed)
curl -i -H 'Authorization: Bearer token' http://localhost:3000/dashboard
# Returns 401 (only Basic auth accepted)

# With empty credentials
curl -i -u : http://localhost:3000/dashboard
# Returns 401
```

**Test 3: View response headers**
```bash
# See both request and response
curl -v -u admin:secret123 http://localhost:3000/dashboard

# Just response headers
curl -i http://localhost:3000/dashboard
```

---

## Testing via REST Client (Postman, etc.)

### Setup in Postman

1. Create new request:
   - Method: GET
   - URL: `http://localhost:3000/dashboard`

2. Go to "Authorization" tab:
   - Type: Basic Auth
   - Username: admin
   - Password: secret123
   - Click "Update Request"

3. Send request - should see response headers:
   ```
   Authorization: Basic YWRtaW46c2VjcmV0MTIz
   ```

### Setup in VS Code REST Client

Create `requests.http`:
```http
### Test dashboard without auth
GET http://localhost:3000/dashboard

### Test dashboard with Basic Auth
GET http://localhost:3000/dashboard
Authorization: Basic YWRtaW46c2VjcmV0MTIz

### Using base64 encoded credentials
GET http://localhost:3000/dashboard
Authorization: Basic admin:secret123
```

---

## Debugging Authentication Issues

### Check Middleware Logs

When testing, watch the server console for logs:

```
[Middleware] HTTP_BASIC_AUTH enabled. Request from 127.0.0.1 to /dashboard
[Middleware] IP 127.0.0.1 is allowlisted - granting access

or

[Middleware] IP 127.0.0.1 is not allowlisted - requiring Basic Auth
[Middleware] Missing or invalid Authorization header for IP 127.0.0.1
```

### Verify Environment Variables

Check if variables are loaded correctly:

```bash
# In .env.local, add a temporary test route:
# GET /api/test-config
# Returns current env variables (remove after testing!)

# Or check in middleware code:
console.log('HTTP_BASIC_AUTH:', process.env.HTTP_BASIC_AUTH);
console.log('BASIC_AUTH_USER:', process.env.BASIC_AUTH_USER);
console.log('ALLOWLIST_IPS:', process.env.ALLOWLIST_IPS);
```

### Common Issues

**Problem**: Always getting 401 even with valid credentials
```bash
# Check:
1. Env variables are set correctly (no trailing spaces)
2. Credentials are Base64 encoded properly
3. Server was restarted after .env.local changes
4. BASIC_AUTH_USER and BASIC_AUTH_PASS match exactly (case-sensitive)
```

**Problem**: Browser keeps asking for password
```bash
# Solution:
1. Check BASIC_AUTH_PASS hasn't changed
2. Clear browser cache/cookies:
   - Ctrl+Shift+Delete (Windows/Linux)
   - Cmd+Shift+Delete (Mac)
3. Try private/incognito window
```

**Problem**: IP allowlist not working
```bash
# Check:
1. Your actual IP (check server logs with [Middleware])
2. ALLOWLIST_IPS format is correct
3. No trailing spaces in ALLOWLIST_IPS
4. CIDR notation matches (e.g., 192.168.0.0/24 includes .1 to .254)
```

---

## Load Testing

### Simple Load Test

```bash
# Send 100 requests in parallel (Unix/Linux)
for i in {1..100}; do
  curl -u admin:secret123 http://localhost:3000/dashboard &
done
wait

# PowerShell
1..100 | ForEach-Object {
  Start-Job -ScriptBlock {
    Invoke-WebRequest -Uri "http://localhost:3000/dashboard" `
      -Credential (New-Object System.Management.Automation.PSCredential('admin', `
        (ConvertTo-SecureString 'secret123' -AsPlainText -Force)))
  }
} | Get-Job | Wait-Job | Remove-Job
```

---

## Security Testing

### Test 1: Verify HTTPS in Production

```bash
# In production, only use over HTTPS
# ❌ DO NOT allow Basic Auth over HTTP

# Test redirect (should redirect to HTTPS)
curl -i http://yourdomain.com/dashboard
# Should return 301/302 redirect to https://
```

### Test 2: Verify Credentials Not Logged

```bash
# Check server logs - credentials should NEVER appear:
# ❌ BAD: Authorization header included
# ✅ GOOD: Just "Invalid credentials provided"

# Check .env files are in .gitignore:
cat .gitignore | grep env
# Should show: *.local, .env, etc.
```

### Test 3: Attempt Timing Attack

```bash
# Legitimate credentials should take ~same time as invalid ones
time curl -u admin:secret123 http://localhost:3000/dashboard
time curl -u admin:wrongpas http://localhost:3000/dashboard

# Times should be essentially identical (no timing leak)
```

---

## Automated Testing

### Using curl in scripts

```bash
#!/bin/bash

echo "Testing Dashboard Authentication..."

# Test 1: Auth disabled
export HTTP_BASIC_AUTH=false
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/dashboard)
echo "✓ Auth disabled: $response (expect 200)"

# Test 2: Auth enabled, allowlisted IP
export HTTP_BASIC_AUTH=true
export ALLOWLIST_IPS=127.0.0.1
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/dashboard)
echo "✓ IP allowlisted: $response (expect 200)"

# Test 3: Auth enabled, missing credentials
export ALLOWLIST_IPS=10.0.0.1
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/dashboard)
echo "✓ Missing credentials: $response (expect 401)"

# Test 4: Auth enabled, with credentials
response=$(curl -s -u admin:secret123 -o /dev/null -w "%{http_code}" \
  http://localhost:3000/dashboard)
echo "✓ Valid credentials: $response (expect 200)"

# Test 5: Auth enabled, invalid credentials
response=$(curl -s -u admin:wrong -o /dev/null -w "%{http_code}" \
  http://localhost:3000/dashboard)
echo "✓ Invalid credentials: $response (expect 401)"

echo "All tests completed!"
```

---

## Test Results Template

Use this template to document test results:

```
Date: ____________________
Tester: __________________
Environment: ______________

Scenario 1: Auth Disabled
- Test: [ ] PASS [ ] FAIL
- Notes: _________________

Scenario 2: Localhost Allowed
- Test: [ ] PASS [ ] FAIL
- Notes: _________________

Scenario 3: Credentials Required
- Without auth: [ ] 401 [ ] Other
- With valid auth: [ ] 200 [ ] Other
- With invalid auth: [ ] 401 [ ] Other
- Notes: _________________

Scenario 4: CIDR Allowlist
- Test: [ ] PASS [ ] FAIL
- Notes: _________________

Scenario 5: Multiple IPs
- Test: [ ] PASS [ ] FAIL
- Notes: _________________

Scenario 6: Browser Dialog
- Dialog appears: [ ] YES [ ] NO
- Authentication works: [ ] YES [ ] NO
- Notes: _________________

Issues Found:
1. _________________________
2. _________________________
3. _________________________
```
