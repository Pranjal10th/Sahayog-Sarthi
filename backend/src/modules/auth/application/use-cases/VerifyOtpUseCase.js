import MobileNumber from '../../domain/value-objects/MobileNumber.js';

export default class VerifyOtpUseCase {
  constructor(userRepository, otpStore, tokenService) {
    this.userRepository = userRepository;
    this.otpStore = otpStore;
    this.tokenService = tokenService;
  }

  async execute({ mobileStr, otpCode, name }) {
    if (!mobileStr || !otpCode) {
      throw new Error('Mobile number and OTP are required.');
    }

    // This checks 10-digit validity
    const mobile = new MobileNumber(mobileStr);

    const record = await this.otpStore.get(mobile.value);
    if (!record) {
      return { success: false, status: 401, message: 'OTP not found or expired.' };
    }

    if (Date.now() > record.expiresAt) {
      await this.otpStore.delete(mobile.value);
      return { success: false, status: 401, message: 'OTP has expired.' };
    }

    if (record.otp !== otpCode) {
      return { success: false, status: 401, message: 'Invalid OTP code.' };
    }

    // Find User
    let user = await this.userRepository.findByMobile(mobile.value);
    if (!user) {
      if (!name) {
        return { success: true, newCustomer: true, message: 'OTP verified. Profile creation required.' };
      }
      user = await this.userRepository.create({ name, mobile: mobile.value });
    }

    // OTP matches, invalidate OTP after successful login or profile creation
    await this.otpStore.delete(mobile.value);

    // Generate Token
    const token = this.tokenService.generate({ id: user.id, role: 'customer' });

    return {
      success: true,
      token,
      user,
      role: 'customer'
    };
  }
}
