// backend/src/modules/payment/infrastructure/gateways/RazorpayAdapter.js

import Razorpay from 'razorpay';
import crypto from 'crypto';
import PaymentGatewayPort from '../../application/ports/PaymentGatewayPort.js';

export default class RazorpayAdapter extends PaymentGatewayPort {
  constructor() {
    super();
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder_id',
      key_secret: process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret'
    });
  }

  async createOrder({ amount, receipt }) {
    const options = {
      amount: amount * 100, // in paise
      currency: 'INR',
      receipt
    };
    return await this.razorpay.orders.create(options);
  }

  async verifySignature({ orderId, paymentId, signature }) {
    const text = orderId + "|" + paymentId;
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret')
      .update(text)
      .digest('hex');

    return generatedSignature === signature;
  }
}
