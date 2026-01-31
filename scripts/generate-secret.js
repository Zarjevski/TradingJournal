#!/usr/bin/env node

/**
 * Generate a secure random secret for NextAuth
 * Usage: node scripts/generate-secret.js
 */

const crypto = require('crypto');

const secret = crypto.randomBytes(32).toString('base64');

console.log('\n🔐 Generated NextAuth Secret:');
console.log('─'.repeat(50));
console.log(secret);
console.log('─'.repeat(50));
console.log('\n📝 Add this to your .env file as:');
console.log(`NEXTAUTH_SECRET="${secret}"\n`);
