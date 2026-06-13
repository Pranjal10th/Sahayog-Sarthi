// backend/src/routes/booking.js
import express from 'express';
import { createBooking, acceptBooking, completeBooking } from '../controllers/bookingController.js';
import { validateBookingCreation } from '../middlewares/validationMiddleware.js'; // INJECTED
import protect from '../middlewares/authMiddleware.js'; // [cite: 239]

const router = express.Router();

// Saare routes authenticated hone chahiye secure guidelines ke mutabik [cite: 239]
// Input validation checks applied on booking submission
router.post('/', protect, validateBookingCreation, createBooking);               // POST /api/v1/bookings
router.put('/:id/accept', protect, acceptBooking);       // PUT /api/v1/bookings/:id/accept
router.put('/:id/complete', protect, completeBooking);   // PUT /api/v1/bookings/:id/complete

export default router;