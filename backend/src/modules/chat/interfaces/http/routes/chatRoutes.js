// backend/src/modules/chat/interfaces/http/routes/chatRoutes.js

import express from 'express';
import { getChatHistory } from '../controllers/ChatController.js';
import protect from '../../../../../middlewares/authMiddleware.js';

const router = express.Router();

// Canonical GET /api/v1/chats/:bookingId
router.get('/:bookingId', protect, getChatHistory);

export default router;
