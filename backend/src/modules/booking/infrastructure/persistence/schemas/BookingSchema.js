// backend/src/modules/booking/infrastructure/persistence/schemas/BookingSchema.js
// Canonical Mongoose schema — idempotent guard prevents overwrite errors in tests

import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  customerId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true },
  workerId:        { type: mongoose.Schema.Types.ObjectId, ref: 'Worker',  required: true },
  serviceType:     { type: String, required: true },
  status: {
    type:    String,
    enum:    ['pending', 'accepted', 'in_progress', 'completed', 'paid', 'cancelled'],
    default: 'pending',
  },
  scheduledAt:     { type: Date, default: Date.now },
  completedAt:     { type: Date },
  amount:          { type: Number, required: true },
  paymentStatus:   { type: String, enum: ['pending', 'paid', 'refunded'], default: 'pending' },
  customerAddress: { type: String, required: true },
  notes:           { type: String },
  metadata:        { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

// Performance compound indexes
bookingSchema.index({ customerId: 1, createdAt: -1 });
bookingSchema.index({ workerId: 1,   createdAt: -1 });
bookingSchema.index({ workerId: 1,   status: 1      });
bookingSchema.index({ status: 1,     createdAt: -1  });

const Booking = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);
export default Booking;
