import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import dotenv from 'dotenv';

// Environment variables ko configure karo taaki process.env read ho sake
dotenv.config();

// In-memory fallback agar Redis integration local setup me nahi hai
const tempOtpStore = new Map(); 

export const generateAndStoreOTP = async (mobile) => {
  const otp = crypto.randomInt(100000, 999999).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minute TTL [cite: 236, 285]

  tempOtpStore.set(mobile, { otp, expiresAt });

  console.log(`\n============== [OTP SIMULATION] ==============`);
  console.log(`📱 Mobile: ${mobile}`);
  console.log(`🔑 Generated OTP: ${otp} (Valid for 5 mins)`);
  console.log(`==============================================\n`);

  return { success: true, message: 'OTP sent successfully (Simulated)' };
};

export const verifyOTPValue = (mobile, userOtp) => {
  const record = tempOtpStore.get(mobile);
  
  if (!record) return { valid: false, message: 'OTP not found or expired.' };
  if (Date.now() > record.expiresAt) {
    tempOtpStore.delete(mobile);
    return { valid: false, message: 'OTP has expired.' };
  }
  if (record.otp !== userOtp) {
    return { valid: false, message: 'Invalid OTP code.' };
  }

  tempOtpStore.delete(mobile); // Invalidate after first use [cite: 285]
  return { valid: true };
};

export const generateToken = (payload) => {
  // Direct '7d' string inject kar dete hain taaki koi format breakdown na ho
  const expiry = "7d"; 
  
  if (!process.env.JWT_SECRET) {
    console.warn("⚠️ JWT_SECRET not found in env, using a temporary fallback key.");
    return jwt.sign(payload, "temporary_fallback_secret_key_123", { expiresIn: expiry });
  }

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: expiry,
  });
};