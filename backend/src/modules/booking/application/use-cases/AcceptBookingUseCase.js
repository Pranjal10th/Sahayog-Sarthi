// backend/src/modules/booking/application/use-cases/AcceptBookingUseCase.js
// Guard: status must be 'pending'. Guard: worker must not be blocked.
// Side effects: cancel 60s timer, socket alert to customer.

import { clearBookingTimeoutTimer } from '../../../../services/reminderService.js';
import Worker from '../../../../models/Worker.js'; // proxy → WorkerSchema.js (Phase 3.2)

export default class AcceptBookingUseCase {
  constructor(bookingRepository, socketAdapter) {
    this.bookingRepository = bookingRepository;
    this.socketAdapter     = socketAdapter;
  }

  async execute(bookingId, reqUserId) {
    // Cancel the 60s pending timeout immediately on worker intervention
    clearBookingTimeoutTimer(bookingId);

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

    // State machine guard: must be pending
    if (booking.status !== 'pending') {
      const err = new Error(`Booking cannot transition from '${booking.status}' to 'accepted'.`);
      err.statusCode = 400;
      throw err;
    }

    // Blocked worker guard
    const worker = await Worker.findById(booking.workerId);
    if (!worker) {
      const err = new Error('Sarthi profile not found.');
      err.statusCode = 404;
      throw err;
    }
    if (worker.isBlocked) {
      const err = new Error('This Sarthi account is blocked and cannot accept bookings.');
      err.statusCode = 403;
      throw err;
    }

    booking.status = 'accepted';
    await booking.save();

    await this.socketAdapter.notifyUser(booking.customerId.toString(), 'booking:accepted', {
      bookingId: booking._id,
      status:    'accepted',
    });

    return booking;
  }
}
