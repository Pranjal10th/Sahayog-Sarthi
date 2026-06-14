import MongoUserRepository from '../persistence/repositories/MongoUserRepository.js';
import MongoWorkerRepository from '../persistence/repositories/MongoWorkerRepository.js';
import JwtTokenService from '../services/JwtTokenService.js';
import SmsService from '../services/SmsService.js';
import InMemoryOtpStore from '../services/InMemoryOtpStore.js';

import SendOtpUseCase from '../../application/use-cases/SendOtpUseCase.js';
import VerifyOtpUseCase from '../../application/use-cases/VerifyOtpUseCase.js';
import RegisterWorkerUseCase from '../../application/use-cases/RegisterWorkerUseCase.js';

// Concrete implementations
const userRepository = new MongoUserRepository();
const workerRepository = new MongoWorkerRepository();
const tokenService = new JwtTokenService();
const smsService = new SmsService();
const otpStore = new InMemoryOtpStore();

// Use Cases
export const sendOtpUseCase = new SendOtpUseCase(otpStore, smsService);
export const verifyOtpUseCase = new VerifyOtpUseCase(userRepository, workerRepository, otpStore, tokenService);
export const registerWorkerUseCase = new RegisterWorkerUseCase(workerRepository, tokenService);
export const globalTokenService = tokenService; // Direct export for legacy helper proxy if needed
export const globalOtpStore = otpStore; // Direct export for test verification

