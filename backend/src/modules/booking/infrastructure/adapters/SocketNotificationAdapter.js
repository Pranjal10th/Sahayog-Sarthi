// backend/src/modules/booking/infrastructure/adapters/SocketNotificationAdapter.js
// Implements NotificationPort — wraps existing socketService without modifying it

import NotificationPort from '../../application/ports/NotificationPort.js';
import * as socketService from '../../../../services/socketService.js';

export default class SocketNotificationAdapter extends NotificationPort {

  async notifyUser(userId, event, payload) {
    try {
      socketService.emitToUser(userId, event, payload);
    } catch (err) {
      console.warn(`⚠️ Socket notifyUser skipped (${event}):`, err.message);
    }
  }

  async notifyRoom(room, event, payload) {
    try {
      socketService.emitToRoom(room, event, payload);
    } catch (err) {
      console.warn(`⚠️ Socket notifyRoom skipped (${event}):`, err.message);
    }
  }

  // No-op for Telegram — handled by TelegramNotificationAdapter
  async sendTelegramAlert() {}
}
