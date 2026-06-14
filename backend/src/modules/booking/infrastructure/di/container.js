// backend/src/modules/booking/infrastructure/di/container.js

import MongoBookingRepository from '../persistence/repositories/MongoBookingRepository.js';
import SocketNotificationAdapter from '../adapters/SocketNotificationAdapter.js';
import TelegramNotificationAdapter from '../adapters/TelegramNotificationAdapter.js';

import CreateBookingUseCase    from '../../application/use-cases/CreateBookingUseCase.js';
import AcceptBookingUseCase    from '../../application/use-cases/AcceptBookingUseCase.js';
import StartBookingUseCase     from '../../application/use-cases/StartBookingUseCase.js';
import CompleteBookingUseCase  from '../../application/use-cases/CompleteBookingUseCase.js';
import CancelBookingUseCase    from '../../application/use-cases/CancelBookingUseCase.js';
import GetBookingByIdUseCase   from '../../application/use-cases/GetBookingByIdUseCase.js';
import GetBookingHistoryUseCase from '../../application/use-cases/GetBookingHistoryUseCase.js';

// Concrete adapters
const bookingRepository  = new MongoBookingRepository();
const socketAdapter      = new SocketNotificationAdapter();
const telegramAdapter    = new TelegramNotificationAdapter();

// Wired use cases
export const createBookingUseCase     = new CreateBookingUseCase(bookingRepository, socketAdapter, telegramAdapter);
export const acceptBookingUseCase     = new AcceptBookingUseCase(bookingRepository, socketAdapter);
export const startBookingUseCase      = new StartBookingUseCase(bookingRepository, socketAdapter);
export const completeBookingUseCase   = new CompleteBookingUseCase(bookingRepository, socketAdapter);
export const cancelBookingUseCase     = new CancelBookingUseCase(bookingRepository, socketAdapter);
export const getBookingByIdUseCase    = new GetBookingByIdUseCase(bookingRepository);
export const getBookingHistoryUseCase = new GetBookingHistoryUseCase(bookingRepository);
