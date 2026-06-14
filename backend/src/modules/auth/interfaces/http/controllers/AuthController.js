import { sendOtpUseCase, verifyOtpUseCase, registerWorkerUseCase } from '../../../infrastructure/di/container.js';

export default class AuthController {
  async sendOTP(req, res) {
    const { mobile } = req.body;
    if (!mobile || mobile.length !== 10) {
      return res.status(400).json({ error: 'Please provide a valid 10-digit mobile number.' });
    }

    try {
      const result = await sendOtpUseCase.execute(mobile);
      return res.status(200).json(result);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  async verifyOTP(req, res) {
    const { mobile, otp, name } = req.body;

    if (!mobile || !otp) {
      return res.status(400).json({ error: 'Mobile number and OTP are required.' });
    }

    try {
      const result = await verifyOtpUseCase.execute({ mobileStr: mobile, otpCode: otp, name });
      
      if (result.success === false) {
        return res.status(result.status || 401).json({ error: result.message });
      }

      if (result.newCustomer) {
        return res.status(200).json({ newCustomer: true, message: result.message });
      }

      // Format response user data to match legacy mongoose doc JSON structure
      const userRes = result.user;
      const formattedUser = {
        _id: userRes.id,
        name: userRes.name,
        mobile: userRes.mobile,
        email: userRes.email,
        profileImage: userRes.profileImage,
        location: userRes.location,
        address: userRes.address,
        isBlocked: userRes.isBlocked,
        createdAt: userRes.createdAt
      };

      return res.status(200).json({
        token: result.token,
        user: formattedUser,
        role: 'customer'
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  async registerWorker(req, res) {
    const { name, mobile, serviceCategory, experience, hourlyRate, longitude, latitude } = req.body;

    if (!name || !mobile || !serviceCategory || experience === undefined || hourlyRate === undefined || longitude === undefined || latitude === undefined) {
      return res.status(400).json({ error: 'All fields including GPS coordinates are mandatory.' });
    }

    try {
      const result = await registerWorkerUseCase.execute({
        name,
        mobileStr: mobile,
        serviceCategory,
        experience,
        hourlyRate,
        longitude,
        latitude
      });

      return res.status(201).json({
        token: result.token,
        worker: result.worker,
        role: 'worker'
      });
    } catch (err) {
      const statusCode = err.status || 500;
      return res.status(statusCode).json({ error: err.message });
    }
  }
}
