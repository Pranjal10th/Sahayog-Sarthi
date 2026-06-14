// backend/src/modules/review/interfaces/http/routes/reviewRoutes.js

import express from 'express';
import { createReview } from '../controllers/ReviewController.js';
import { validateReviewSubmission } from '../../../../../middlewares/validationMiddleware.js';
import protect from '../../../../../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/', protect, validateReviewSubmission, createReview);

export default router;
