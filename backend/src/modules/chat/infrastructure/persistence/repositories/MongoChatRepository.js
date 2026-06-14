// backend/src/modules/chat/infrastructure/persistence/repositories/MongoChatRepository.js

import ChatRepositoryPort from '../../../application/ports/ChatRepositoryPort.js';
import Chat from '../schemas/ChatSchema.js';

export default class MongoChatRepository extends ChatRepositoryPort {
  async create(data) {
    return await Chat.create(data);
  }

  async findByBookingId(bookingId) {
    return await Chat.find({ bookingId }).sort({ timestamp: 1 });
  }
}
