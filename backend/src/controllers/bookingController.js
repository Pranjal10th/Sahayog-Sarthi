import Booking from '../models/Booking.js';
import * as socketService from '../services/socketService.js';

// 1. Create a New Booking Request (Customer Endpoint)
export const createBooking = async (req, res) => {
  const { workerId, serviceType, amount, customerAddress, notes } = req.body;
  // req.user humein protect middleware se milega
  const customerId = req.user.id; 

  try {
    const booking = await Booking.create({
      customerId,
      workerId,
      serviceType,
      amount,
      customerAddress,
      notes,
      status: 'pending'
    });

    // Real-time Event trigger karo worker ke liye over Socket
    // Payload matches SRS Step 6 table specifications
    socketService.emitToUser(workerId, 'booking:new', {
      bookingId: booking._id,
      serviceType,
      address: customerAddress,
      amount
    });

    return res.status(201).json({ success: true, booking });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// 2. Accept Booking (Worker Endpoint)
export const acceptBooking = async (req, res) => {
  const { id } = req.params;

  try {
    const booking = await Booking.findById(id);
    if (!booking) return res.status(404).json({ error: 'Booking not found.' });
    if (booking.status !== 'pending') return res.status(400).json({ error: 'Booking already handled.' });

    booking.status = 'accepted';
    await booking.save();

    // Customer ko notification bhejo via socket
    socketService.emitToUser(booking.customerId.toString(), 'booking:accepted', {
      bookingId: booking._id,
      status: 'accepted'
    });

    return res.status(200).json({ success: true, booking });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// 3. Complete Booking (Worker Endpoint)
export const completeBooking = async (req, res) => {
  const { id } = req.params;

  try {
    const booking = await Booking.findById(id);
    if (!booking) return res.status(404).json({ error: 'Booking not found.' });

    booking.status = 'completed';
    booking.completedAt = new Date();
    await booking.save();

    // Customer ko trigger bhejo payments open karne ke liye
    socketService.emitToRoom(`booking_${id}`, 'booking:completed', {
      bookingId: id,
      amount: booking.amount
    });

    return res.status(200).json({ success: true, booking });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};