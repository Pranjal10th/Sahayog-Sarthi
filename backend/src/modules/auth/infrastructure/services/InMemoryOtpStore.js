import OtpStorePort from '../../application/ports/OtpStorePort.js';

const tempOtpStore = new Map();

export default class InMemoryOtpStore extends OtpStorePort {
  async store(mobile, otp, ttlMs) {
    const expiresAt = Date.now() + ttlMs;
    tempOtpStore.set(mobile, { otp, expiresAt });
  }

  async get(mobile) {
    return tempOtpStore.get(mobile);
  }

  async delete(mobile) {
    tempOtpStore.delete(mobile);
  }
}
