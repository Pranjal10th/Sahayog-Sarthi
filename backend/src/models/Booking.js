import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker', required: true },
  serviceType: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'accepted', 'in_progress', 'completed', 'cancelled'],
    default: 'pending' 
  },
  scheduledAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
  amount: { type: Number, required: true },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'refunded'], default: 'pending' },
  customerAddress: { type: String, required: true },
  notes: { type: String }
}, { timestamps: true });

const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;