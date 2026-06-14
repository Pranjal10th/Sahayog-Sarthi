import Razorpay from 'razorpay';
import crypto from 'crypto';
import Booking from '../models/Booking.js';
import Worker from '../models/Worker.js';
import Payment from '../models/Payment.js';

// Try/Catch block taaki placeholder values se library initialize hote waqt crash na ho
let razorpay;
try {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder_id',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret'
  });
} catch (e) {
  console.log("⚠️ Razorpay SDK initialization skipped or mocked.");
}

// 1. Create Order API (With Mock Fallback)
export const createPaymentOrder = async (req, res) => {
  const { bookingId } = req.body;

  try {
    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ error: 'Booking record not found.' });

    // Agar real keys nahi hain toh automatic sandbox response return karega
    if (!process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID.includes('placeholder')) {
      console.log(`💰 [MOCK PAYMENT] Generating Sandbox Order for Booking: ${bookingId}`);
      const orderId = `order_mock_${crypto.randomBytes(6).toString('hex')}`;
      const commissionRate = Number(process.env.PLATFORM_COMMISSION) || 0.15;
      const platformFee = booking.amount * commissionRate;
      const workerAmount = booking.amount - platformFee;

      await Payment.create({
        bookingId: booking._id,
        customerId: booking.customerId,
        workerId: booking.workerId,
        razorpayOrderId: orderId,
        amount: booking.amount,
        platformFee,
        workerAmount,
        status: 'created'
      });

      return res.status(200).json({
        success: true,
        mocked: true,
        order: {
          id: orderId,
          entity: "order",
          amount: booking.amount * 100, // paise mein conversion
          amount_paid: 0,
          amount_due: booking.amount * 100,
          currency: "INR",
          receipt: `receipt_booking_${booking._id}`,
          status: "created"
        }
      });
    }

    // Real Razorpay Execution
    const options = {
      amount: booking.amount * 100, 
      currency: 'INR',
      receipt: `receipt_booking_${booking._id}`
    };

    const order = await razorpay.orders.create(options);

    const commissionRate = Number(process.env.PLATFORM_COMMISSION) || 0.15;
    const platformFee = booking.amount * commissionRate;
    const workerAmount = booking.amount - platformFee;

    await Payment.create({
      bookingId: booking._id,
      customerId: booking.customerId,
      workerId: booking.workerId,
      razorpayOrderId: order.id,
      amount: booking.amount,
      platformFee,
      workerAmount,
      status: 'created'
    });

    return res.status(200).json({ success: true, order });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// 2. Verify Payment Signature & Sarthi Wallet Settlement
export const verifyPaymentSignature = async (req, res) => {
  const { bookingId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  try {
    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ error: 'Booking record not found.' });

    // Sandbox validation bypass flag check
    if (razorpay_order_id && razorpay_order_id.startsWith('order_mock_')) {
      await Booking.findByIdAndUpdate(bookingId, { paymentStatus: 'paid' });
      
      const commissionRate = Number(process.env.PLATFORM_COMMISSION) || 0.15;
      const netEarnings = booking.amount * (1 - commissionRate);

      // Wallet atomic settlement trigger increment query
      const updatedWorker = await Worker.findByIdAndUpdate(
        booking.workerId, 
        { $inc: { walletBalance: netEarnings } },
        { returnDocument: 'after' }
      );

      // Update Payment status to paid
      await Payment.findOneAndUpdate(
        { razorpayOrderId: razorpay_order_id },
        { 
          status: 'paid', 
          razorpayPaymentId: razorpay_payment_id || `pay_mock_${crypto.randomBytes(6).toString('hex')}`,
          paymentMethod: 'mock_wallet' 
        }
      );

      console.log(`💰 [WALLET SETTLEMENT] Sandbox Pay Verified. Transferred ₹${netEarnings} to Sarthi Wallet.`);
      console.log(`📈 New Balance for Sarthi ${booking.workerId}: ₹${updatedWorker.walletBalance}`);

      return res.status(200).json({ 
        success: true, 
        mocked: true,
        message: 'Sandbox payment verification simulated. Worker wallet credited!',
        booking: { ...booking._doc, paymentStatus: 'paid' }
      });
    }

    // Standard Cryptographic Production verification 
    const text = razorpay_order_id + "|" + razorpay_payment_id;
    const generated_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret')
      .update(text)
      .digest('hex');

    if (generated_signature === razorpay_signature) {
      await Booking.findByIdAndUpdate(bookingId, { paymentStatus: 'paid' });
      const commissionRate = Number(process.env.PLATFORM_COMMISSION) || 0.15;
      const netEarnings = booking.amount * (1 - commissionRate);

      const updatedWorker = await Worker.findByIdAndUpdate(
        booking.workerId, 
        { $inc: { walletBalance: netEarnings } },
        { returnDocument: 'after' }
      );

      // Update Payment status to paid
      await Payment.findOneAndUpdate(
        { razorpayOrderId: razorpay_order_id },
        { 
          status: 'paid', 
          razorpayPaymentId: razorpay_payment_id,
          paymentMethod: 'razorpay'
        }
      );

      console.log(`💰 [WALLET SETTLEMENT] Production Pay Verified. Transferred ₹${netEarnings} to Sarthi Wallet.`);

      return res.status(200).json({ success: true, message: 'Payment verified!', booking });
    } else {
      await Payment.findOneAndUpdate(
        { razorpayOrderId: razorpay_order_id },
        { status: 'failed' }
      );
      return res.status(400).json({ error: 'Invalid payment signature alignment.' });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// 3. Request Wallet Withdrawal (Sarthi Payout Audit Trail)
export const requestWalletWithdrawal = async (req, res) => {
  const { amount } = req.body;
  const workerId = req.user?.id;
  const role = req.user?.role;

  if (role !== 'worker') {
    return res.status(403).json({ success: false, error: 'Only registered workers can request withdrawals.' });
  }

  if (!amount || amount <= 0) {
    return res.status(400).json({ success: false, error: 'Please specify a valid withdrawal amount.' });
  }

  try {
    const worker = await Worker.findById(workerId);
    if (!worker) {
      return res.status(404).json({ success: false, error: 'Worker profile not found.' });
    }

    if (worker.walletBalance < amount) {
      return res.status(400).json({ success: false, error: 'Insufficient wallet balance for withdrawal.' });
    }

    // Deduct from worker's wallet balance
    worker.walletBalance -= amount;
    await worker.save();

    // Create withdrawal transaction record in Payment collection
    const transaction = await Payment.create({
      workerId,
      amount,
      platformFee: 0,
      workerAmount: amount,
      status: 'withdrawal_completed', // Simulating instant payout approval for beta/dev sandbox
      paymentMethod: 'bank_transfer',
      transactionType: 'withdrawal'
    });

    console.log(`🏦 [WITHDRAWAL] Worker ${workerId} withdrew ₹${amount}. New balance: ₹${worker.walletBalance}`);

    return res.status(200).json({
      success: true,
      message: 'Withdrawal processed successfully!',
      transaction,
      newBalance: worker.walletBalance
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};