import express from 'express';
import { createPaymentOrder, verifyPaymentSignature } from '../controllers/paymentController.js';
import protect from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/create-order', protect, createPaymentOrder); // /api/v1/payments/create-order
router.post('/verify', protect, verifyPaymentSignature);    // /api/v1/payments/verify

export default router;