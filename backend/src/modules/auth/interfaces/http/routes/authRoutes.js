import express from 'express';
import AuthController from '../controllers/AuthController.js';

const router = express.Router();
const controller = new AuthController();

// Map route endpoints preserving controller execution scope
router.post('/send-otp', (req, res) => controller.sendOTP(req, res));
router.post('/verify-otp', (req, res) => controller.verifyOTP(req, res));
router.post('/register/worker', (req, res) => controller.registerWorker(req, res));

export default router;
