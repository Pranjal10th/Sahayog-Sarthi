// backend/src/modules/review/infrastructure/di/container.js

import MongoReviewRepository from '../persistence/repositories/MongoReviewRepository.js';
import MongoBookingRepository from '../../../booking/infrastructure/persistence/repositories/MongoBookingRepository.js';
import MongoWorkerRepository from '../../../worker/infrastructure/persistence/repositories/MongoWorkerRepository.js';
import CreateReviewUseCase from '../../application/use-cases/CreateReviewUseCase.js';

const reviewRepository = new MongoReviewRepository();
const bookingRepository = new MongoBookingRepository();
const workerRepository = new MongoWorkerRepository();

export const createReviewUseCase = new CreateReviewUseCase(
  reviewRepository,
  bookingRepository,
  workerRepository
);
