// backend/src/modules/chat/domain/entities/ChatMessage.js
// Pure domain entity for Chat — no Mongoose or infrastructure dependencies

export default class ChatMessage {
  constructor({
    id,
    bookingId,
    senderId,
    senderModel,
    message,
    timestamp
  }) {
    this.id = id;
    this.bookingId = bookingId;
    this.senderId = senderId;
    this.senderModel = senderModel;
    this.message = message;
    this.timestamp = timestamp ?? new Date();
  }
}
