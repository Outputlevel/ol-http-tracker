/**
 * IP allowlist and CIDR validation utilities
 * 
 * Provides helpers for parsing, validating, and checking
 * IP addresses against allowlists with CIDR notation support
 */

/**
 * Parse comma-separated IP allowlist from environment variable
 * 
 * Supports:
 * - Single IPv4 addresses: "192.168.1.1"
 * - CIDR notation: "192.168.0.0/24"
 * - Multiple entries: "127.0.0.1,192.168.1.0/24,10.0.0.1"
 * 
 * @param allowlistStr - Comma-separated allowlist string
 * @returns Array of parsed allowlist entries
 * 
 * @example
 * const entries = parseAllowlist('127.0.0.1,192.168.0.0/24');
 * // entries = ['127.0.0.1', '192.168.0.0/24']
 */
export function parseAllowlist(allowlistStr: string): string[] {
  if (!allowlistStr) {
    return [];
  }

  return allowlistStr
    .split(',')
    .map(entry => entry.trim())
    .filter(entry => entry.length > 0);
}

/**
 * Check if IP matches an allowed pattern
 * 
 * @param ip - IP address to check
 * @param allowedPattern - Single IP or CIDR notation
 * @returns true if IP matches pattern
 * 
 * @example
 * matchesPattern('192.168.1.50', '192.168.1.50'); // true (exact match)
 * matchesPattern('192.168.1.50', '192.168.0.0/24'); // false (not in range)
 * matchesPattern('192.168.1.50', '192.168.1.0/24'); // true (in CIDR range)
 */
export function matchesPattern(ip: string, allowedPattern: string): boolean {
  // Exact IP match
  if (allowedPattern === ip) {
    return true;
  }

  // CIDR range check
  if (allowedPattern.includes('/')) {
    return isIpInCidr(ip, allowedPattern);
  }

  return false;
}

/**
 * Check if IP is in CIDR range (IPv4 only)
 * 
 * CIDR notation: "192.168.0.0/24" means "192.168.0.0 to 192.168.0.255"
 * 
 * @param ip - IP address to check
 * @param cidr - CIDR notation (e.g., "192.168.0.0/24")
 * @returns true if IP is within CIDR range
 * 
 * @example
 * isIpInCidr('192.168.1.50', '192.168.1.0/24'); // true
 * isIpInCidr('192.168.2.50', '192.168.1.0/24'); // false
 * isIpInCidr('10.0.0.1', '10.0.0.0/16'); // true
 */
export function isIpInCidr(ip: string, cidr: string): boolean {
  try {
    const [network, maskBitsStr] = cidr.split('/');

    if (!network || !maskBitsStr) {
      return false;
    }

    const mask = parseInt(maskBitsStr, 10);

    // Validate mask bits
    if (mask < 0 || mask > 32 || isNaN(mask)) {
      console.warn(`[IP Validation] Invalid CIDR mask: ${maskBitsStr}`);
      return false;
    }

    // Convert IPs to numbers
    const ipNum = ipToNumber(ip);
    const networkNum = ipToNumber(network);

    // If conversion failed, return false
    if (ipNum === -1 || networkNum === -1) {
      return false;
    }

    // Calculate network mask
    const maskNum = (0xffffffff << (32 - mask)) >>> 0;

    // Check if IP is in network range
    return (ipNum & maskNum) === (networkNum & maskNum);
  } catch (error) {
    console.error(`[IP Validation] Error checking CIDR ${cidr}:`, error);
    return false;
  }
}

/**
 * Convert IPv4 address string to 32-bit number
 * 
 * @param ip - IPv4 address (e.g., "192.168.1.1")
 * @returns 32-bit unsigned integer representation or -1 if invalid
 * 
 * @example
 * ipToNumber('127.0.0.1'); // 2130706433
 * ipToNumber('192.168.1.1'); // 3232235777
 * ipToNumber('invalid'); // -1
 */
export function ipToNumber(ip: string): number {
  const parts = ip.trim().split('.');

  // Must have exactly 4 octets
  if (parts.length !== 4) {
    return -1;
  }

  try {
    const bytes = parts.map(octet => {
      const num = parseInt(octet, 10);

      // Each octet must be 0-255
      if (isNaN(num) || num < 0 || num > 255) {
        throw new Error(`Invalid octet: ${octet}`);
      }

      return num;
    });

    // Combine octets into 32-bit number
    // Using >>> 0 to convert to unsigned 32-bit integer
    return (
      ((bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3]) >>> 0
    );
  } catch (error) {
    return -1;
  }
}

/**
 * Validate IPv4 address format
 * 
 * @param ip - IP address to validate
 * @returns true if IP has valid IPv4 format
 * 
 * @example
 * isValidIPv4('192.168.1.1'); // true
 * isValidIPv4('256.1.1.1'); // false (octet out of range)
 * isValidIPv4('192.168.1'); // false (missing octet)
 * isValidIPv4('192.168.1.1.1'); // false (too many octets)
 */
export function isValidIPv4(ip: string): boolean {
  return ipToNumber(ip) !== -1;
}

/**
 * Validate CIDR notation format
 * 
 * @param cidr - CIDR notation to validate
 * @returns true if CIDR has valid format
 * 
 * @example
 * isValidCIDR('192.168.0.0/24'); // true
 * isValidCIDR('192.168.0.0/33'); // false (mask > 32)
 * isValidCIDR('192.168.0.0'); // false (missing mask)
 */
export function isValidCIDR(cidr: string): boolean {
  if (!cidr.includes('/')) {
    return false;
  }

  const [network, maskStr] = cidr.split('/');

  if (!network || !maskStr) {
    return false;
  }

  const mask = parseInt(maskStr, 10);

  // Validate network IP
  if (!isValidIPv4(network)) {
    return false;
  }

  // Validate mask
  if (isNaN(mask) || mask < 0 || mask > 32) {
    return false;
  }

  return true;
}
