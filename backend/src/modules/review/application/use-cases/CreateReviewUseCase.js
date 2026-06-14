// backend/src/modules/review/application/use-cases/CreateReviewUseCase.js

export default class CreateReviewUseCase {
  constructor(reviewRepository, bookingRepository, workerRepository) {
    this.reviewRepository = reviewRepository;
    this.bookingRepository = bookingRepository;
    this.workerRepository = workerRepository;
  }

  async execute({ bookingId, customerId, rating, comment }) {
    if (!bookingId || !rating || rating < 1 || rating > 5) {
      const err = new Error('Please provide a valid bookingId and a rating between 1 and 5 stars.');
      err.statusCode = 400;
      throw err;
    }

    const booking = await this.bookingRepository.findById(bookingId);
    if (!booking) {
      const err = new Error('Booking record not found.');
      err.statusCode = 404;
      throw err;
    }

    if (booking.status !== 'completed') {
      const err = new Error('You can only review a service after it has been marked as completed.');
      err.statusCode = 400;
      throw err;
    }

    const existingReview = await this.reviewRepository.findOne({ bookingId });
    if (existingReview) {
      const err = new Error('You have already submitted a review for this booking.');
      err.statusCode = 400;
      throw err;
    }

    const review = await this.reviewRepository.create({
      bookingId,
      customerId,
      workerId: booking.workerId,
      rating: Number(rating),
      comment
    });

    // Aggregate rating stats
    const stats = await this.reviewRepository.aggregate([
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
      await this.workerRepository.updateById(booking.workerId, {
        rating: Math.round(stats[0].avgRating * 10) / 10,
        totalRatings: stats[0].total
      });
    }

    return review;
  }
}
