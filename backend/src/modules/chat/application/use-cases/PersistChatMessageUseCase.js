// backend/src/modules/chat/application/use-cases/PersistChatMessageUseCase.js

export default class PersistChatMessageUseCase {
  constructor(chatRepository) {
    this.chatRepository = chatRepository;
  }

  async execute({ bookingId, senderId, senderModel, message }) {
    if (!bookingId || !senderId || !senderModel || !message) {
      throw new Error('All message parameters (bookingId, senderId, senderModel, message) are required');
    }
    return await this.chatRepository.create({
      bookingId,
      senderId,
      senderModel,
      message
    });
  }
}
