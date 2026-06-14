// backend/src/modules/chat/application/use-cases/GetChatHistoryUseCase.js

export default class GetChatHistoryUseCase {
  constructor(chatRepository) {
    this.chatRepository = chatRepository;
  }

  async execute(bookingId) {
    if (!bookingId) {
      throw new Error('Booking ID is required');
    }
    return await this.chatRepository.findByBookingId(bookingId);
  }
}
