// backend/src/modules/review/infrastructure/persistence/schemas/ReviewSchema.js
// Canonical Mongoose schema for Review — idempotent guard prevents overwrite errors in tests

import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
    unique: true // Strict rule: One review per booking constraint
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  workerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Worker',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5 // Range 1 to 5 stars
  },
  comment: {
    type: String,
    trim: true // Optional feedback context storage
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for aggregating profile ratings and history searches
reviewSchema.index({ workerId: 1 });
reviewSchema.index({ customerId: 1 });

const Review = mongoose.models.Review || mongoose.model('Review', reviewSchema);
export default Review;
