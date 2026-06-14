// backend/src/modules/booking/application/use-cases/GetBookingHistoryUseCase.js

export default class GetBookingHistoryUseCase {
  constructor(bookingRepository) {
    this.bookingRepository = bookingRepository;
  }

  /**
   * @param {string} userId
   * @param {'customer'|'worker'} role
   * @param {number} page
   * @param {number} limit
   */
  async execute(userId, role, page = 1, limit = 10) {
    const skip   = (page - 1) * limit;
    const filter = role === 'worker' ? { workerId: userId } : { customerId: userId };

    const [bookings, total] = await Promise.all([
      this.bookingRepository.findWithFilter(filter, { sort: { createdAt: -1 }, skip, limit, populate: true }),
      this.bookingRepository.countDocuments(filter),
    ]);

    return {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      bookings,
    };
  }
}
