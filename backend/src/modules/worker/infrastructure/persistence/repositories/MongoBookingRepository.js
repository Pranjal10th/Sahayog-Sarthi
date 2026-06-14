// backend/src/modules/worker/infrastructure/persistence/repositories/MongoBookingRepository.js
// Minimal read-only adapter used by Worker dashboard — does NOT replace bookingController

import Booking from '../../../../../models/Booking.js';

export default class MongoBookingRepository {

  async findActiveForWorker(workerId) {
    return await Booking.find({
      workerId,
      status: { $in: ['accepted', 'in_progress'] },
    }).populate('customerId', 'name mobile profileImage');
  }

  async getDistinctBookingIds(workerId) {
    return await Booking.find({ workerId }).distinct('_id');
  }

  async findLiveBookings() {
    return await Booking.find({
      status: { $in: ['pending', 'accepted', 'in_progress'] }
    }).sort({ createdAt: -1 });
  }
}
