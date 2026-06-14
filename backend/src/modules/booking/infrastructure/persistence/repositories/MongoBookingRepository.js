// backend/src/modules/booking/infrastructure/persistence/repositories/MongoBookingRepository.js

import BookingRepositoryPort from '../../../application/ports/BookingRepositoryPort.js';
import Booking from '../schemas/BookingSchema.js';

export default class MongoBookingRepository extends BookingRepositoryPort {

  async create(data) {
    return await Booking.create(data);
  }

  async findById(id) {
    return await Booking.findById(id);
  }

  async findByIdPopulated(id) {
    return await Booking.findById(id)
      .populate('customerId', 'name mobile profileImage')
      .populate('workerId',   'name mobile serviceCategory rating location');
  }

  async findByIdAndUpdate(id, update) {
    return await Booking.findByIdAndUpdate(id, update, { new: true });
  }

  async save(doc) {
    return await doc.save();
  }

  async findWithFilter(filter, { sort = { createdAt: -1 }, skip = 0, limit = 10, populate = false } = {}) {
    let query = Booking.find(filter).sort(sort).skip(skip).limit(limit);
    if (populate) {
      query = query
        .populate('customerId', 'name mobile profileImage')
        .populate('workerId',   'name mobile serviceCategory rating');
    }
    return await query;
  }

  async countDocuments(filter) {
    return await Booking.countDocuments(filter);
  }
}
