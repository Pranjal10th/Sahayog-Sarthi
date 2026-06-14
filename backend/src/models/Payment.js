import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: false, index: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker', required: true, index: true },
  razorpayOrderId: { type: String, required: false },
  razorpayPaymentId: { type: String },
  amount: { type: Number, required: true },
  platformFee: { type: Number, required: true, default: 0 },
  workerAmount: { type: Number, required: true },
  status: { type: String, enum: ['created', 'paid', 'failed', 'refunded', 'withdrawal_pending', 'withdrawal_completed'], default: 'created', index: true },
  paymentMethod: { type: String },
  transactionType: { type: String, enum: ['payment', 'withdrawal'], default: 'payment' },
  transactionDate: { type: Date, default: Date.now }
}, { timestamps: true });

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;