// backend/src/modules/booking/application/use-cases/GetBookingByIdUseCase.js

export default class GetBookingByIdUseCase {
  constructor(bookingRepository) {
    this.bookingRepository = bookingRepository;
  }

  async execute(bookingId) {
    const booking = await this.bookingRepository.findByIdPopulated(bookingId);
    if (!booking) {
      const err = new Error('Booking not found.');
      err.statusCode = 404;
      throw err;
    }
    return booking;
  }
}
