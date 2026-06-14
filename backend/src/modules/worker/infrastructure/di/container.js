// backend/src/modules/worker/infrastructure/di/container.js
// Dependency Injection container for the Worker module
// All concrete implementations are wired here

import MongoWorkerRepository from '../persistence/repositories/MongoWorkerRepository.js';
import MongoBookingRepository from '../persistence/repositories/MongoBookingRepository.js';
import MongoPaymentRepository from '../persistence/repositories/MongoPaymentRepository.js';
import MongoLocationAdapter from '../persistence/adapters/MongoLocationAdapter.js';
import MongoUserRepository from '../persistence/repositories/MongoUserRepository.js';

import ApproveWorkerKycUseCase from '../../application/use-cases/ApproveWorkerKycUseCase.js';
import RejectWorkerKycUseCase from '../../application/use-cases/RejectWorkerKycUseCase.js';
import BlockWorkerUseCase from '../../application/use-cases/BlockWorkerUseCase.js';
import UnblockWorkerUseCase from '../../application/use-cases/UnblockWorkerUseCase.js';
import UpdateWorkerAvailabilityUseCase from '../../application/use-cases/UpdateWorkerAvailabilityUseCase.js';
import FindNearbyWorkersUseCase from '../../application/use-cases/FindNearbyWorkersUseCase.js';
import GetWorkerDashboardUseCase from '../../application/use-cases/GetWorkerDashboardUseCase.js';
import GetAdminOverviewUseCase from '../../application/use-cases/GetAdminOverviewUseCase.js';

// Concrete adapter instances
const workerRepository  = new MongoWorkerRepository();
const bookingRepository = new MongoBookingRepository();
const paymentRepository = new MongoPaymentRepository();
const locationAdapter   = new MongoLocationAdapter();
const userRepository    = new MongoUserRepository();

// Wired use cases
export const approveWorkerKycUseCase      = new ApproveWorkerKycUseCase(workerRepository);
export const rejectWorkerKycUseCase       = new RejectWorkerKycUseCase(workerRepository);
export const blockWorkerUseCase           = new BlockWorkerUseCase(workerRepository);
export const unblockWorkerUseCase         = new UnblockWorkerUseCase(workerRepository);
export const updateWorkerAvailabilityUseCase = new UpdateWorkerAvailabilityUseCase(workerRepository);
export const findNearbyWorkersUseCase     = new FindNearbyWorkersUseCase(locationAdapter);
export const getWorkerDashboardUseCase    = new GetWorkerDashboardUseCase(workerRepository, bookingRepository, paymentRepository);
export const getAdminOverviewUseCase      = new GetAdminOverviewUseCase(workerRepository, bookingRepository, paymentRepository, userRepository);
