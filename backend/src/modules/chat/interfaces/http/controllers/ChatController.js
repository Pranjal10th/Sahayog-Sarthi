// backend/src/modules/chat/interfaces/http/controllers/ChatController.js

import { getChatHistoryUseCase } from '../../../infrastructure/di/container.js';

/**
 * Fetch chat history for an active booking session
 */
export const getChatHistory = async (req, res) => {
  // Support both :bookingId (canonical) and :id (legacy route parameter name)
  const bookingId = req.params.bookingId || req.params.id;

  try {
    const messages = await getChatHistoryUseCase.execute(bookingId);
    return res.status(200).json({ success: true, messages });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
