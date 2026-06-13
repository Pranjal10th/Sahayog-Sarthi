// backend/src/routes/review.js
import express from 'express';
import { createReview } from '../controllers/review.js';
import { validateReviewSubmission } from '../middlewares/validationMiddleware.js'; // INJECTED
import protect from '../middlewares/authMiddleware.js';

const router = express.Router();

// POST /api/v1/reviews -> Secure validation entry checkpoint [cite: 145]
router.post('/', protect, validateReviewSubmission, createReview); 

export default router;