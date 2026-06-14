// backend/src/modules/booking/application/use-cases/CompleteBookingUseCase.js
// Guard: status must be 'in_progress'.
// Side effects: sets completedAt timestamp, socket event to booking room.

export default class CompleteBookingUseCase {
  constructor(bookingRepository, socketAdapter) {
    this.bookingRepository = bookingRepository;
    this.socketAdapter     = socketAdapter;
  }

  async execute(bookingId, reqUserId) {
    const booking = await this.bookingRepository.findById(bookingId);
    if (!booking) {
      const err = new Error('Booking not found.');
      err.statusCode = 404;
      throw err;
    }

    if (reqUserId && booking.workerId.toString() !== reqUserId) {
      const err = new Error('Access denied. You are not the assigned worker for this booking.');
      err.statusCode = 403;
      throw err;
    }

    if (booking.status !== 'in_progress') {
      const err = new Error(`Booking cannot transition from '${booking.status}' to 'completed'.`);
      err.statusCode = 400;
      throw err;
    }

    booking.status      = 'completed';
    booking.completedAt = new Date();
    await booking.save();

    await this.socketAdapter.notifyRoom(`booking_${bookingId}`, 'booking:completed', {
      bookingId,
      amount: booking.amount,
    });

    return booking;
  }
}
