// backend/src/controllers/chatController.js
import Chat from '../models/Chat.js';

/**
 * Fetch chat history for an active booking session
 * Route: GET /api/v1/chats/:bookingId
 */
export const getChatHistory = async (req, res) => {
  const { bookingId } = req.params;

  try {
    const messages = await Chat.find({ bookingId }).sort({ timestamp: 1 });
    return res.status(200).json({ success: true, messages });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};