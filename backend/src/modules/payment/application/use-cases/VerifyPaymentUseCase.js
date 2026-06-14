// backend/src/modules/payment/application/use-cases/VerifyPaymentUseCase.js

import crypto from 'crypto';

export default class VerifyPaymentUseCase {
  constructor(bookingRepository, paymentRepository, workerRepository, razorpayGateway, mockGateway) {
    this.bookingRepository = bookingRepository;
    this.paymentRepository = paymentRepository;
    this.workerRepository = workerRepository;
    this.razorpayGateway = razorpayGateway;
    this.mockGateway = mockGateway;
  }

  async execute({ bookingId, razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
    if (!bookingId) {
      throw new Error('Booking ID is required');
    }

    const booking = await this.bookingRepository.findById(bookingId);
    if (!booking) {
      const err = new Error('Booking record not found.');
      err.statusCode = 404;
      throw err;
    }

    if (booking.status !== 'completed') {
      const err = new Error(`Booking must be in 'completed' status to verify payment (current: '${booking.status}').`);
      err.statusCode = 400;
      throw err;
    }

    const isMock = razorpay_order_id && razorpay_order_id.startsWith('order_mock_');
    const gateway = isMock ? this.mockGateway : this.razorpayGateway;

    const isValid = await gateway.verifySignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature
    });

    const commissionRate = Number(process.env.PLATFORM_COMMISSION) || 0.15;
    const netEarnings = booking.amount * (1 - commissionRate);

    if (isValid) {
      // Update Booking status to paid
      await this.bookingRepository.findByIdAndUpdate(bookingId, { paymentStatus: 'paid', status: 'paid' });

      // Update Worker Wallet balance
      const updatedWorker = await this.workerRepository.updateById(
        booking.workerId,
        { $inc: { walletBalance: netEarnings } }
      );

      // Update Payment status to paid
      await this.paymentRepository.findOneAndUpdate(
        { razorpayOrderId: razorpay_order_id },
        {
          status: 'paid',
          razorpayPaymentId: razorpay_payment_id || `pay_mock_${crypto.randomBytes(6).toString('hex')}`,
          paymentMethod: isMock ? 'mock_wallet' : 'razorpay'
        }
      );

      const updatedBooking = await this.bookingRepository.findById(bookingId);
      return {
        success: true,
        mocked: isMock,
        message: isMock ? 'Sandbox payment verification simulated. Worker wallet credited!' : 'Payment verified!',
        booking: updatedBooking
      };
    } else {
      // Failed signature matching
      await this.paymentRepository.findOneAndUpdate(
        { razorpayOrderId: razorpay_order_id },
        { status: 'failed' }
      );
      const err = new Error('Invalid payment signature alignment.');
      err.statusCode = 400;
      throw err;
    }
  }
}
