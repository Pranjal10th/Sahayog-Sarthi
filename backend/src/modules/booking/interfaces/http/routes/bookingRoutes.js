// backend/src/modules/booking/interfaces/http/routes/bookingRoutes.js
// Mirrors legacy src/routes/booking.js structure exactly

import express from 'express';
import {
  createBooking,
  acceptBooking,
  startBooking,
  completeBooking,
  cancelBooking,
  getBookingById,
  getBookingHistory,
} from '../controllers/BookingController.js';
import { getChatHistory } from '../../../../chat/interfaces/http/controllers/ChatController.js';
import { validateBookingCreation } from '../../../../../middlewares/validationMiddleware.js';
import protect from '../../../../../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/',             protect, validateBookingCreation, createBooking);   // POST   /api/v1/bookings
router.get('/history',       protect, getBookingHistory);                        // GET    /api/v1/bookings/history
router.get('/chats/:id',     protect, getChatHistory);                           // GET    /api/v1/bookings/chats/:id
router.get('/:id',           protect, getBookingById);                           // GET    /api/v1/bookings/:id
router.put('/:id/accept',    protect, acceptBooking);                            // PUT    /api/v1/bookings/:id/accept
router.put('/:id/complete',  protect, completeBooking);                          // PUT    /api/v1/bookings/:id/complete
router.put('/:id/cancel',    protect, cancelBooking);                            // PUT    /api/v1/bookings/:id/cancel
router.put('/:id/start',     protect, startBooking);                             // PUT    /api/v1/bookings/:id/start

export default router;
