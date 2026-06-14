// backend/src/modules/payment/infrastructure/gateways/MockPaymentAdapter.js

import crypto from 'crypto';
import PaymentGatewayPort from '../../application/ports/PaymentGatewayPort.js';

export default class MockPaymentAdapter extends PaymentGatewayPort {
  async createOrder({ amount, receipt }) {
    const orderId = `order_mock_${crypto.randomBytes(6).toString('hex')}`;
    return {
      id: orderId,
      entity: "order",
      amount: amount * 100, // in paise
      amount_paid: 0,
      amount_due: amount * 100,
      currency: "INR",
      receipt,
      status: "created"
    };
  }

  async verifySignature({ orderId, paymentId, signature }) {
    // Sandbox simulation returns true for mock orders
    return orderId && orderId.startsWith('order_mock_');
  }
}
