// backend/src/modules/chat/infrastructure/di/container.js

import MongoChatRepository from '../persistence/repositories/MongoChatRepository.js';
import GetChatHistoryUseCase from '../../application/use-cases/GetChatHistoryUseCase.js';
import PersistChatMessageUseCase from '../../application/use-cases/PersistChatMessageUseCase.js';

// Concrete repository
const chatRepository = new MongoChatRepository();

// Wired use cases
export const getChatHistoryUseCase = new GetChatHistoryUseCase(chatRepository);
export const persistChatMessageUseCase = new PersistChatMessageUseCase(chatRepository);
