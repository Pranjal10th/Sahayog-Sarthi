// backend/src/config/env.js
// Environment variable validation module.
// Crashes the app on startup if critical keys are missing,
// preventing silent runtime failures.

import dotenv from 'dotenv';

dotenv.config();

const requiredVars = [
  'MONGO_URI',
  'JWT_SECRET',
];

const optionalVars = [
  'PORT',
  'NODE_ENV',
  'JWT_EXPIRES_IN',
  'REDIS_URL',
  'TELEGRAM_BOT_TOKEN',
  'ENABLE_TELEGRAM_BOT',
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
  'PLATFORM_COMMISSION',
  'MSG91_AUTH_KEY',
  'MSG91_SENDER_ID',
  'MSG91_TEMPLATE_ID',
];

const missing = requiredVars.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error('❌ FATAL: Missing required environment variables:');
  missing.forEach((key) => console.error(`   • ${key}`));
  console.error('\nCopy .env.example to .env and fill in the values.');
  process.exit(1);
}

// Warn about optional but useful variables
const unset = optionalVars.filter((key) => !process.env[key]);
if (unset.length > 0) {
  console.warn('⚠️  Optional environment variables not set (sandbox fallbacks will be used):');
  unset.forEach((key) => console.warn(`   • ${key}`));
}

const env = {
  PORT: Number(process.env.PORT) || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  REDIS_URL: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || '',
  ENABLE_TELEGRAM_BOT: process.env.ENABLE_TELEGRAM_BOT === 'true',
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || '',
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || '',
  PLATFORM_COMMISSION: Number(process.env.PLATFORM_COMMISSION) || 0.15,
  MSG91_AUTH_KEY: process.env.MSG91_AUTH_KEY || '',
  MSG91_SENDER_ID: process.env.MSG91_SENDER_ID || '',
  MSG91_TEMPLATE_ID: process.env.MSG91_TEMPLATE_ID || '',
};

export default env;
