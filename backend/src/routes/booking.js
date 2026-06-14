// backend/src/routes/booking.js
import express from 'express';
import { 
  createBooking, 
  acceptBooking, 
  completeBooking,
  getBookingById,
  getBookingHistory,
  cancelBooking,
  startBooking
} from '../controllers/bookingController.js';
import { getChatHistory } from '../controllers/chatController.js';
import { validateBookingCreation } from '../middlewares/validationMiddleware.js'; // INJECTED
import protect from '../middlewares/authMiddleware.js'; // [cite: 239]

const router = express.Router();

// Saare routes authenticated hone chahiye secure guidelines ke mutabik [cite: 239]
// Input validation checks applied on booking submission
router.post('/', protect, validateBookingCreation, createBooking);               // POST /api/v1/bookings
router.get('/history', protect, getBookingHistory);                             // GET /api/v1/bookings/history
router.get('/chats/:id', protect, getChatHistory);                              // GET /api/v1/bookings/chats/:id
router.get('/:id', protect, getBookingById);                                    // GET /api/v1/bookings/:id
router.put('/:id/accept', protect, acceptBooking);                              // PUT /api/v1/bookings/:id/accept
router.put('/:id/complete', protect, completeBooking);                          // PUT /api/v1/bookings/:id/complete
router.put('/:id/cancel', protect, cancelBooking);                              // PUT /api/v1/bookings/:id/cancel
router.put('/:id/start', protect, startBooking);                                // PUT /api/v1/bookings/:id/start

export default router;