// backend/src/modules/booking/application/use-cases/CancelBookingUseCase.js
// Guard: status must be 'pending' or 'accepted'.
// Side effects: fee metadata if cancelled from 'accepted', timer clear if from 'pending', socket event.

import { clearBookingTimeoutTimer } from '../../../../services/reminderService.js';

export default class CancelBookingUseCase {
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

    if (booking.status !== 'pending' && booking.status !== 'accepted') {
      const err = new Error(`Booking cannot transition from '${booking.status}' to 'cancelled'.`);
      err.statusCode = 400;
      throw err;
    }

    const oldStatus   = booking.status;
    booking.status    = 'cancelled';

    // Metadata cancellation fee (assessed only when cancelled after worker acceptance)
    if (oldStatus === 'accepted') {
      booking.metadata = {
        ...booking.metadata,
        cancellationFee: {
          amount:    50,
          currency:  'INR',
          assessedAt: new Date(),
          reason:    'Cancellation assessed after booking acceptance by Sarthi',
        },
      };
    }

    await booking.save();

    // Clear timer if the booking was still in pending state
    if (oldStatus === 'pending') {
      clearBookingTimeoutTimer(bookingId);
    }

    await this.socketAdapter.notifyRoom(`booking_${bookingId}`, 'booking:cancelled', {
      bookingId,
      status:   'cancelled',
      metadata: booking.metadata,
    });

    return booking;
  }
}
