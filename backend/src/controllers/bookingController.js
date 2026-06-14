import Booking from '../models/Booking.js';
import Worker from '../models/Worker.js';
import * as socketService from '../services/socketService.js';
import { sendBookingAlertToWorker } from '../services/telegramService.js';

// IN-MEMORY BACKGROUND SCHEDULER DICTIONARY MAP REGISTRY
const activeBookingTimers = new Map(); // bookingId -> setTimeout references

// Helper to gracefully cancel dangling pending timeouts
const clearLiveTimer = (bookingId) => {
  const timerRef = activeBookingTimers.get(bookingId.toString());
  if (timerRef) {
    clearTimeout(timerRef);
    activeBookingTimers.delete(bookingId.toString());
    console.log(`🗑️ [REMINDER ENGINE] Timeout registry cleared for Booking: ${bookingId}`);
  }
};

// 1. Create a New Booking Request (Customer Endpoint)
export const createBooking = async (req, res) => {
  const { workerId, serviceType, amount, customerAddress, notes } = req.body;
  const customerId = req.user?.id || "6a2c1a295ca7ff1dfef3dbcf"; // Safety check fallback for auth tokens

  console.log("🚀 [BOOKING TRIGGERED] Frontend se request received!");
  console.log(`📋 Details -> Worker: ${workerId}, Category: ${serviceType}, Address: ${customerAddress}`);

  try {
    const booking = await Booking.create({
      customerId,
      workerId,
      serviceType,
      amount: amount || 250,
      customerAddress,
      notes,
      status: 'pending'
    });

    // A. Real-time Event trigger over Socket
    socketService.emitToUser(workerId, 'booking:new', {
      bookingId: booking._id,
      serviceType,
      address: customerAddress,
      amount
    });

    // B. HARDCODED BOT DISPATCH (Forcing immediate telegram alert)
    try {
      const testTelegramChatId = "6872504161"; // Aapki dynamic chat ID
      console.log(`📡 [TELEGRAM ENGINE] Dispatching alert strictly to: ${testTelegramChatId}`);
      
      await sendBookingAlertToWorker(testTelegramChatId, booking);
      console.log("✅ [TELEGRAM ENGINE] Bot call sent successfully!");
    } catch (botErr) {
      console.error("❌ Telegram channel notification dispatch failure:", botErr);
    }

    // C. SRS SPEC AUTOMATION (FR-11): Spawn an asynchronous 60-second auto-timeout thread
    const timerReference = setTimeout(async () => {
      try {
        const checkBooking = await Booking.findById(booking._id);
        // Ensure state change only executes if booking is still unhandled/pending
        if (checkBooking && checkBooking.status === 'pending') {
          checkBooking.status = 'cancelled';
          await checkBooking.save();

          console.log(`🚨 [TIMEOUT EXPIRED] Booking ${booking._id} automatic teardown triggered.`);

          // Inform client browser via socket workspace channel immediately
          socketService.emitToRoom(`booking_${booking._id}`, 'booking:timeout', {
            bookingId: booking._id,
            message: "No response from nearby Sarthi within 60 seconds."
          });
        }
        activeBookingTimers.delete(booking._id.toString());
      } catch (timeoutErr) {
        console.error("❌ Timeout async execution crash avoided:", timeoutErr);
      }
    }, 60000); // 60 Seconds strict cycle boundary 

    // Save timer reference globally inside cache maps
    activeBookingTimers.set(booking._id.toString(), timerReference);

    return res.status(201).json({ success: true, booking });
  } catch (error) {
    console.error("❌ Booking creation error:", error);
    return res.status(500).json({ error: error.message });
  }
};

// 2. Accept Booking (Worker Endpoint)
export const acceptBooking = async (req, res) => {
  const { id } = req.params;
  try {
    // Kill live background timeout countdown loop immediately on active intervention
    clearLiveTimer(id);

    const booking = await Booking.findById(id);
    if (!booking) return res.status(404).json({ error: 'Booking not found.' });
    if (booking.status !== 'pending') return res.status(400).json({ error: 'Booking already handled.' });

    booking.status = 'accepted';
    await booking.save();

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

    socketService.emitToRoom(`booking_${id}`, 'booking:completed', {
      bookingId: id,
      amount: booking.amount
    });

    return res.status(200).json({ success: true, booking });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// 4. Get Booking By ID (Internal/External sync)
export const getBookingById = async (req, res) => {
  const { id } = req.params;
  try {
    const booking = await Booking.findById(id)
      .populate('customerId', 'name mobile profileImage')
      .populate('workerId', 'name mobile serviceCategory rating location');
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found.' });
    }
    return res.status(200).json({ success: true, booking });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// 5. Get Booking History (Paginated search by Role filter)
export const getBookingHistory = async (req, res) => {
  const userId = req.user.id;
  const role = req.user.role;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  try {
    const filter = role === 'worker' ? { workerId: userId } : { customerId: userId };
    const bookings = await Booking.find(filter)
      .populate('customerId', 'name mobile profileImage')
      .populate('workerId', 'name mobile serviceCategory rating')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Booking.countDocuments(filter);

    return res.status(200).json({
      success: true,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      bookings
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// 6. Cancel Booking (Before Acceptance)
export const cancelBooking = async (req, res) => {
  const { id } = req.params;
  try {
    const booking = await Booking.findById(id);
    if (!booking) return res.status(404).json({ success: false, error: 'Booking not found.' });

    // Only pending bookings can be cancelled
    if (booking.status !== 'pending') {
      return res.status(400).json({ success: false, error: 'Only pending bookings can be cancelled.' });
    }

    booking.status = 'cancelled';
    await booking.save();

    // Clear any live timer associated with this booking
    clearLiveTimer(id);

    socketService.emitToRoom(`booking_${id}`, 'booking:cancelled', {
      bookingId: id,
      status: 'cancelled'
    });

    return res.status(200).json({ success: true, booking });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// 7. Start Booking (Accepted -> In Progress transitions)
export const startBooking = async (req, res) => {
  const { id } = req.params;
  try {
    const booking = await Booking.findById(id);
    if (!booking) return res.status(404).json({ success: false, error: 'Booking not found.' });

    if (booking.status !== 'accepted') {
      return res.status(400).json({ success: false, error: 'Booking must be accepted before starting.' });
    }

    booking.status = 'in_progress';
    await booking.save();

    socketService.emitToRoom(`booking_${id}`, 'booking:started', {
      bookingId: id,
      status: 'in_progress'
    });

    return res.status(200).json({ success: true, booking });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};