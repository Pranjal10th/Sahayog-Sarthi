// backend/src/modules/booking/application/use-cases/CreateBookingUseCase.js
// Side effects: socket alert to worker, Telegram alert, 60s auto-cancel timer

import { startBookingTimeoutCountdown } from '../../../../services/reminderService.js';

export default class CreateBookingUseCase {
  /**
   * @param {BookingRepositoryPort} bookingRepository
   * @param {SocketNotificationAdapter} socketAdapter
   * @param {TelegramNotificationAdapter} telegramAdapter
   */
  constructor(bookingRepository, socketAdapter, telegramAdapter) {
    this.bookingRepository  = bookingRepository;
    this.socketAdapter      = socketAdapter;
    this.telegramAdapter    = telegramAdapter;
  }

  async execute({ customerId, workerId, serviceType, amount, customerAddress, notes }) {
    const booking = await this.bookingRepository.create({
      customerId,
      workerId,
      serviceType,
      amount:          amount || 250,
      customerAddress,
      notes,
      status:          'pending',
    });

    // A. Real-time socket event to worker
    await this.socketAdapter.notifyUser(workerId, 'booking:new', {
      bookingId:   booking._id,
      serviceType,
      address:     customerAddress,
      amount,
    });

    // B. Telegram alert — hardcoded chat ID preserved from legacy controller
    const testTelegramChatId = '6872504161';
    console.log(`📡 [TELEGRAM ENGINE] Dispatching alert strictly to: ${testTelegramChatId}`);
    await this.telegramAdapter.sendTelegramAlert(testTelegramChatId, booking);
    console.log('✅ [TELEGRAM ENGINE] Bot call sent successfully!');

    // C. 60s auto-cancel timer — delegates to existing reminderService (no new timer Map)
    startBookingTimeoutCountdown(booking._id.toString(), testTelegramChatId);

    return booking;
  }
}
