export default class OtpStorePort {
  async store(mobile, otp, ttlMs) {
    throw new Error('Method store not implemented.');
  }

  async get(mobile) {
    throw new Error('Method get not implemented.');
  }

  async delete(mobile) {
    throw new Error('Method delete not implemented.');
  }
}
