// backend/src/modules/booking/infrastructure/adapters/TelegramNotificationAdapter.js
// Implements NotificationPort.sendTelegramAlert — wraps existing telegramService

import NotificationPort from '../../application/ports/NotificationPort.js';
import { sendBookingAlertToWorker } from '../../../../services/telegramService.js';

export default class TelegramNotificationAdapter extends NotificationPort {

  async sendTelegramAlert(chatId, booking) {
    try {
      await sendBookingAlertToWorker(chatId, booking);
    } catch (err) {
      console.error('❌ Telegram channel notification dispatch failure:', err);
    }
  }

  // No-op for socket methods — handled by SocketNotificationAdapter
  async notifyUser() {}
  async notifyRoom() {}
}
