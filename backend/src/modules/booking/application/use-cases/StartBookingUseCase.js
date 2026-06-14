// backend/src/modules/booking/application/use-cases/StartBookingUseCase.js
// Guard: status must be 'accepted'.
// Side effects: socket event to booking room.

export default class StartBookingUseCase {
  constructor(bookingRepository, socketAdapter) {
    this.bookingRepository = bookingRepository;
    this.socketAdapter     = socketAdapter;
  }

  async execute(bookingId) {
    const booking = await this.bookingRepository.findById(bookingId);
    if (!booking) {
      const err = new Error('Booking not found.');
      err.statusCode = 404;
      throw err;
    }

    if (booking.status !== 'accepted') {
      const err = new Error(`Booking cannot transition from '${booking.status}' to 'in_progress'.`);
      err.statusCode = 400;
      throw err;
    }

    booking.status = 'in_progress';
    await booking.save();

    await this.socketAdapter.notifyRoom(`booking_${bookingId}`, 'booking:started', {
      bookingId,
      status: 'in_progress',
    });

    return booking;
  }
}
