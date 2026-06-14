// backend/src/modules/payment/application/ports/PaymentGatewayPort.js

export default class PaymentGatewayPort {
  async createOrder({ amount, receipt }) {
    throw new Error('Not implemented: createOrder');
  }

  async verifySignature({ orderId, paymentId, signature }) {
    throw new Error('Not implemented: verifySignature');
  }
}
