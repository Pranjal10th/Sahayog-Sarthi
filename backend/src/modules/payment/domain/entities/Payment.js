// backend/src/modules/payment/domain/entities/Payment.js
// Pure domain entity for Payment — no Mongoose or infrastructure dependencies

export default class PaymentEntity {
  constructor({
    id,
    bookingId,
    customerId,
    workerId,
    razorpayOrderId,
    razorpayPaymentId,
    amount,
    platformFee,
    workerAmount,
    status,
    paymentMethod,
    transactionType,
    transactionDate,
    createdAt,
    updatedAt
  }) {
    this.id = id;
    this.bookingId = bookingId;
    this.customerId = customerId;
    this.workerId = workerId;
    this.razorpayOrderId = razorpayOrderId;
    this.razorpayPaymentId = razorpayPaymentId;
    this.amount = amount;
    this.platformFee = platformFee ?? 0;
    this.workerAmount = workerAmount;
    this.status = status ?? 'created';
    this.paymentMethod = paymentMethod;
    this.transactionType = transactionType ?? 'payment';
    this.transactionDate = transactionDate ?? new Date();
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}
