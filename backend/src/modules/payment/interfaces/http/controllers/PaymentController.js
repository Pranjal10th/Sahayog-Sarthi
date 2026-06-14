// backend/src/modules/payment/interfaces/http/controllers/PaymentController.js

import {
  createPaymentOrderUseCase,
  verifyPaymentUseCase,
  requestWithdrawalUseCase
} from '../../../infrastructure/di/container.js';

export const createPaymentOrder = async (req, res) => {
  const { bookingId } = req.body;

  try {
    const result = await createPaymentOrderUseCase.execute({ bookingId });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ error: error.message });
  }
};

export const verifyPaymentSignature = async (req, res) => {
  const { bookingId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  try {
    const result = await verifyPaymentUseCase.execute({
      bookingId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ error: error.message });
  }
};

export const requestWalletWithdrawal = async (req, res) => {
  const { amount } = req.body;
  const workerId = req.user?.id;
  const role = req.user?.role;

  try {
    const result = await requestWithdrawalUseCase.execute({
      amount,
      workerId,
      role
    });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
};
