// backend/src/modules/booking/application/ports/NotificationPort.js

export default class NotificationPort {
  async notifyUser(userId, event, payload)   { throw new Error('Not implemented: notifyUser'); }
  async notifyRoom(room, event, payload)     { throw new Error('Not implemented: notifyRoom'); }
  async sendTelegramAlert(chatId, booking)   { throw new Error('Not implemented: sendTelegramAlert'); }
}
