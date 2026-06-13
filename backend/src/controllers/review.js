// backend/src/controllers/review.js
import Review from '../models/Review.js';
import Worker from '../models/Worker.js';
import Booking from '../models/Booking.js';

export const createReview = async (req, res) => {
  const { bookingId, rating, comment } = req.body;
  const customerId = req.user.id; // Extracted from authMiddleware session validation payload

  if (!bookingId || !rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Please provide a valid bookingId and a rating between 1 and 5 stars.' });
  }

  try {
    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ error: 'Booking record not found.' });
    
    if (booking.status !== 'completed') {
      return res.status(400).json({ error: 'You can only review a service after it has been marked as completed.' });
    }

    // 1. Unique double review check validation constraint execution
    const existingReview = await Review.findOne({ bookingId });
    if (existingReview) {
      return res.status(400).json({ error: 'You have already submitted a review for this booking.' });
    }

    // 2. Create New Verified Review Document record
    const review = await Review.create({
      bookingId,
      customerId,
      workerId: booking.workerId,
      rating: Number(rating),
      comment
    });

    // 3. Dynamic Worker Rating Aggregation Pipeline
    const stats = await Review.aggregate([
      { $match: { workerId: booking.workerId } },
      { 
        $group: { 
          _id: '$workerId', 
          avgRating: { $avg: '$rating' }, 
          total: { $sum: 1 } 
        } 
      }
    ]);

    if (stats.length > 0) {
      await Worker.findByIdAndUpdate(booking.workerId, {
        rating: Math.round(stats[0].avgRating * 10) / 10, // Round decimal precision parameter to 1 place
        totalRatings: stats[0].total
      });
    }

    return res.status(201).json({ 
      success: true, 
      message: 'Review saved and worker score updated successfully!', 
      review 
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};