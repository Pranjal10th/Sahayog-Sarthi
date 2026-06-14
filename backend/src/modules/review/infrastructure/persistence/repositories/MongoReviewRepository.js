// backend/src/modules/review/infrastructure/persistence/repositories/MongoReviewRepository.js

import ReviewRepositoryPort from '../../../application/ports/ReviewRepositoryPort.js';
import Review from '../schemas/ReviewSchema.js';

export default class MongoReviewRepository extends ReviewRepositoryPort {
  async create(data) {
    return await Review.create(data);
  }

  async findOne(filter) {
    return await Review.findOne(filter);
  }

  async aggregate(pipeline) {
    return await Review.aggregate(pipeline);
  }
}
