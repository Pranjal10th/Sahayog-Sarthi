// backend/src/models/Chat.js (Backward Compatibility Proxy Wrapper)
// All imports of `../models/Chat.js` now resolve to the canonical schema
// defined in the clean Chat module. This eliminates duplicate schema
// definitions and ensures a single source of truth for the Chat collection.
import Chat from '../modules/chat/infrastructure/persistence/schemas/ChatSchema.js';
export default Chat;