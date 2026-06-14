import crypto from 'crypto';
import MobileNumber from '../../domain/value-objects/MobileNumber.js';

export default class SendOtpUseCase {
  constructor(otpStore, smsService) {
    this.otpStore = otpStore;
    this.smsService = smsService;
  }

  async execute(mobileStr) {
    const mobile = new MobileNumber(mobileStr);
    
    const otp = crypto.randomInt(100000, 999999).toString();
    const ttlMs = 5 * 60 * 1000; // 5 minutes TTL

    await this.otpStore.store(mobile.value, otp, ttlMs);
    await this.smsService.sendOtp(mobile.value, otp);

    return { success: true, message: 'OTP sent successfully (Simulated)' };
  }
}
