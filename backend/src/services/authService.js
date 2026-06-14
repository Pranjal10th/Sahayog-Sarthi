// backend/src/services/authService.js (Backward Compatibility Proxy Wrapper)
import { globalTokenService } from '../modules/auth/infrastructure/di/container.js';

export const generateToken = (payload) => {
  return globalTokenService.generate(payload);
};