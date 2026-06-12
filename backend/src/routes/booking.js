import express from 'express';
import { createBooking, acceptBooking, completeBooking } from '../controllers/bookingController.js';
import protect from '../middlewares/authMiddleware.js';

const router = express.Router();

// Saare routes authenticated hone chahiye secure guidelines ke mutabik
router.post('/', protect, createBooking);               // POST /api/v1/bookings
router.put('/:id/accept', protect, acceptBooking);       // PUT /api/v1/bookings/:id/accept
router.put('/:id/complete', protect, completeBooking);   // PUT /api/v1/bookings/:id/complete

export default router;