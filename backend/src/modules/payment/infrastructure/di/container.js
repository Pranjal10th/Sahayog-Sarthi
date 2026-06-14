// backend/src/modules/payment/infrastructure/di/container.js

import MongoPaymentRepository from '../persistence/repositories/MongoPaymentRepository.js';
import MongoBookingRepository from '../../../booking/infrastructure/persistence/repositories/MongoBookingRepository.js';
import MongoWorkerRepository from '../../../worker/infrastructure/persistence/repositories/MongoWorkerRepository.js';

import RazorpayAdapter from '../gateways/RazorpayAdapter.js';
import MockPaymentAdapter from '../gateways/MockPaymentAdapter.js';

import CreatePaymentOrderUseCase from '../../application/use-cases/CreatePaymentOrderUseCase.js';
import VerifyPaymentUseCase from '../../application/use-cases/VerifyPaymentUseCase.js';
import RequestWithdrawalUseCase from '../../application/use-cases/RequestWithdrawalUseCase.js';

// Repositories
const paymentRepository = new MongoPaymentRepository();
const bookingRepository = new MongoBookingRepository();
const workerRepository = new MongoWorkerRepository();

// Gateways
const razorpayGateway = new RazorpayAdapter();
const mockGateway = new MockPaymentAdapter();

// Use Cases
export const createPaymentOrderUseCase = new CreatePaymentOrderUseCase(
  bookingRepository,
  paymentRepository,
  razorpayGateway,
  mockGateway
);

export const verifyPaymentUseCase = new VerifyPaymentUseCase(
  bookingRepository,
  paymentRepository,
  workerRepository,
  razorpayGateway,
  mockGateway
);

export const requestWithdrawalUseCase = new RequestWithdrawalUseCase(
  paymentRepository,
  workerRepository
);
