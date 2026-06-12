import express from 'express';
import { sendOTP, verifyOTP, registerWorker } from '../controllers/authController.js';

const router = express.Router();

router.post('/send-otp', sendOTP);         // /api/v1/auth/send-otp 
router.post('/verify-otp', verifyOTP);     // /api/v1/auth/verify-otp 
router.post('/register/worker', registerWorker); // /api/v1/auth/register/worker 

export default router;