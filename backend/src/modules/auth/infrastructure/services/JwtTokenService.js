import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import TokenPort from '../../application/ports/TokenPort.js';

// Configure dotenv
dotenv.config();

export default class JwtTokenService extends TokenPort {
  generate(payload) {
    const expiry = '7d';
    const secret = process.env.JWT_SECRET || 'temporary_fallback_secret_key_123';

    if (!process.env.JWT_SECRET) {
      console.warn("⚠️ JWT_SECRET not found in env, using a temporary fallback key.");
    }

    return jwt.sign(payload, secret, { expiresIn: expiry });
  }
}
