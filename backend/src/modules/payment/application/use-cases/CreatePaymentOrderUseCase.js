// backend/src/modules/payment/application/use-cases/CreatePaymentOrderUseCase.js

export default class CreatePaymentOrderUseCase {
  constructor(bookingRepository, paymentRepository, razorpayGateway, mockGateway) {
    this.bookingRepository = bookingRepository;
    this.paymentRepository = paymentRepository;
    this.razorpayGateway = razorpayGateway;
    this.mockGateway = mockGateway;
  }

  async execute({ bookingId }) {
    if (!bookingId) {
      throw new Error('Booking ID is required');
    }

    const booking = await this.bookingRepository.findById(bookingId);
    if (!booking) {
      const err = new Error('Booking record not found.');
      err.statusCode = 404;
      throw err;
    }

    const isMock = !process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID.includes('placeholder');
    const gateway = isMock ? this.mockGateway : this.razorpayGateway;

    const receipt = `receipt_booking_${booking._id}`;
    const order = await gateway.createOrder({ amount: booking.amount, receipt });

    const commissionRate = Number(process.env.PLATFORM_COMMISSION) || 0.15;
    const platformFee = booking.amount * commissionRate;
    const workerAmount = booking.amount - platformFee;

    await this.paymentRepository.create({
      bookingId: booking._id,
      customerId: booking.customerId,
      workerId: booking.workerId,
      razorpayOrderId: order.id,
      amount: booking.amount,
      platformFee,
      workerAmount,
      status: 'created'
    });

    return {
      success: true,
      mocked: isMock,
      order
    };
  }
}
