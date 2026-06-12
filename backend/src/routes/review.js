import express from 'express';
import { createReview } from '../controllers/review.js';
import protect from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/', protect, createReview); // POST /api/v1/reviews

export default router;