// backend/src/models/Chat.js
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

export default mongoose.model('Chat', chatSchema);