// backend/src/modules/worker/infrastructure/persistence/repositories/MongoPaymentRepository.js
// Minimal read-only adapter used by Worker dashboard — does NOT replace paymentController

import Payment from '../../../../../models/Payment.js';
import Booking from '../../../../../models/Booking.js';

export default class MongoPaymentRepository {

  async findRecentForWorker(workerId, limit = 10) {
    const bookingIds = await Booking.find({ workerId }).distinct('_id');
    return await Payment.find({ bookingId: { $in: bookingIds } })
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  async findPaidPayments() {
    return await Payment.find({ status: 'paid' });
  }
}
