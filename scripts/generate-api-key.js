#!/usr/bin/env node

/**
 * Generate a secure API key for the HTTP Request Tracker
 * Usage: node scripts/generate-api-key.js
 */

const crypto = require('crypto');

/**
 * Generate a secure random API key
 * @returns {string} Generated API key
 */
function generateApiKey() {
  return `sk_live_${crypto.randomBytes(32).toString('hex')}`;
}

// Main execution
const apiKey = generateApiKey();

console.log('\n' + '='.repeat(60));
console.log('Generated API Key');
console.log('='.repeat(60));
console.log(`\n${apiKey}\n`);
console.log('Instructions:');
console.log('1. Copy the API key above');
console.log('2. Add it to your .env.local file:');
console.log(`   API_KEY=${apiKey}`);
console.log('3. Restart your development server (npm run dev)');
console.log('\n' + '='.repeat(60) + '\n');

// Also output the key to stdout for scripting
process.stdout.write(apiKey);
