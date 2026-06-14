// backend/src/modules/review/domain/entities/Review.js
// Pure domain entity for Review — no Mongoose or infrastructure dependencies

export default class ReviewEntity {
  constructor({
    id,
    bookingId,
    customerId,
    workerId,
    rating,
    comment,
    createdAt
  }) {
    this.id = id;
    this.bookingId = bookingId;
    this.customerId = customerId;
    this.workerId = workerId;
    this.rating = rating;
    this.comment = comment;
    this.createdAt = createdAt ?? new Date();
  }
}
