// backend/src/modules/chat/infrastructure/persistence/schemas/ChatSchema.js
// Canonical Mongoose schema for Chat — idempotent guard prevents overwrite errors in tests

import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
    index: true // Faster query for fetching historical chat logs
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  senderModel: {
    type: String,
    required: true,
    enum: ['User', 'Worker'] // Identifies if sender is Customer or Sarthi
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Compound index for historical chat retrieval (sorted old to new)
chatSchema.index({ bookingId: 1, timestamp: 1 });

const Chat = mongoose.models.Chat || mongoose.model('Chat', chatSchema);
export default Chat;
