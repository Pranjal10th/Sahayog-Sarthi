// backend/src/modules/review/interfaces/http/controllers/ReviewController.js

import { createReviewUseCase } from '../../../infrastructure/di/container.js';

export const createReview = async (req, res) => {
  const { bookingId, rating, comment } = req.body;
  const customerId = req.user.id;

  try {
    const review = await createReviewUseCase.execute({
      bookingId,
      customerId,
      rating,
      comment
    });

    return res.status(201).json({
      success: true,
      message: 'Review saved and worker score updated successfully!',
      review
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ error: error.message });
  }
};
