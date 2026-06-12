import * as authService from '../services/authService.js';
import User from '../models/User.js';
import Worker from '../models/Worker.js';

// 1. Send OTP to Customer/Worker
export const sendOTP = async (req, res) => {
  const { mobile } = req.body;
  if (!mobile || mobile.length !== 10) {
    return res.status(400).json({ error: 'Please provide a valid 10-digit mobile number.' });
  }

  try {
    const result = await authService.generateAndStoreOTP(mobile);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// 2. Verify OTP & Login/Register Customer
export const verifyOTP = async (req, res) => {
  const { mobile, otp, name } = req.body; // registration ke waqt optional name accept karenge

  if (!mobile || !otp) {
    return res.status(400).json({ error: 'Mobile number and OTP are required.' });
  }

  const verification = authService.verifyOTPValue(mobile, otp);
  if (!verification.valid) {
    return res.status(401).json({ error: verification.message });
  }

  try {
    // Find or create customer in MongoDB [cite: 238]
    let user = await User.findOne({ mobile });
    if (!user) {
      if (!name) {
        return res.status(200).json({ newCustomer: true, message: 'OTP verified. Profile creation required.' });
      }
      user = await User.create({ name, mobile });
    }

    const token = authService.generateToken({ id: user._id, role: 'customer' });
    return res.status(200).json({ token, user, role: 'customer' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// 3. Worker Multi-field Registration 
export const registerWorker = async (req, res) => {
  const { name, mobile, serviceCategory, experience, hourlyRate, longitude, latitude } = req.body;

  if (!name || !mobile || !serviceCategory || !experience || !hourlyRate || !longitude || !latitude) {
    return res.status(400).json({ error: 'All fields including GPS coordinates are mandatory.' });
  }

  try {
    let existingWorker = await Worker.findOne({ mobile });
    if (existingWorker) return res.status(400).json({ error: 'Worker with this mobile already exists.' });

    const newWorker = await Worker.create({
      name,
      mobile,
      serviceCategory,
      experience: Number(experience),
      hourlyRate: Number(hourlyRate),
      location: {
        type: 'Point',
        coordinates: [Number(longitude), Number(latitude)] // [lng, lat] format strictly [cite: 137]
      },
      kycStatus: 'pending' // Admin verify karega baad me [cite: 137]
    });

    const token = authService.generateToken({ id: newWorker._id, role: 'worker' });
    return res.status(201).json({ token, worker: newWorker, role: 'worker' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};