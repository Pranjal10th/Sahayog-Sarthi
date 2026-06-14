// backend/src/modules/payment/interfaces/http/routes/paymentRoutes.js

import express from 'express';
import {
  createPaymentOrder,
  verifyPaymentSignature,
  requestWalletWithdrawal
} from '../controllers/PaymentController.js';
import protect from '../../../../../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/create-order', protect, createPaymentOrder);
router.post('/verify', protect, verifyPaymentSignature);
router.post('/withdraw', protect, requestWalletWithdrawal);

export default router;
