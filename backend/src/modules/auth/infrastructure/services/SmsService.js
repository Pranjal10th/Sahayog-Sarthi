import SmsPort from '../../application/ports/SmsPort.js';

export default class SmsService extends SmsPort {
  async sendOtp(mobile, otp) {
    console.log(`\n============== [OTP SIMULATION] ==============`);
    console.log(`📱 Mobile: ${mobile}`);
    console.log(`🔑 Generated OTP: ${otp} (Valid for 5 mins)`);
    console.log(`==============================================\n`);
    return { success: true };
  }
}
