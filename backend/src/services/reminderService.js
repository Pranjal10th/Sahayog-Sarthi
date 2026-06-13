// backend/src/services/reminderService.js
import Booking from '../models/Booking.js';
import { emitToRoom } from './socketService.js';
// import { sendTelegramMessage } from './telegramService.js'; // Aapke telegram bot integration ke liye

// Active timeouts tracking storage map registry
const activeBookingTimers = new Map(); // bookingId -> setTimeout Reference

/**
 * Start a 60-Second countdown for an incoming booking request
 * @param {String} bookingId - Target Booking document ID
 * @param {String} telegramChatId - Active Sarthi's telegram chat identification
 */
export const startBookingTimeoutCountdown = (bookingId, telegramChatId) => {
  console.log(`⏱️ Reminder Engine: Initiating 60s countdown for Booking ${bookingId}`);

  // Setup standard timeout loop matching SRS FR-11 specs (60 seconds)
  const timerRef = setTimeout(async () => {
    try {
      // 1. Fetch current status of the target booking
      const booking = await Booking.findById(bookingId);

      if (booking && booking.status === 'pending') {
        // 2. Perform atomic state machine transition to 'cancelled' or custom 'timeout'
        booking.status = 'cancelled'; // Or 'timeout' as per schema mapping
        await booking.save();

        console.log(`🚨 Reminder Engine: Booking ${bookingId} timed out. No response within 60 seconds.`);

        // 3. Broadcast real-time update to the customer viewport over socket channel
        emitToRoom(`booking_${bookingId}`, 'booking:timeout', {
          bookingId,
          message: 'No response from nearby Sarthi. Request timed out.'
        });

        // 4. (Optional) Sarthi ko bot par informational update text alert dispatch karna
        /*
        if (telegramChatId) {
          await sendTelegramMessage(telegramChatId, `⚠️ *Request Expired!*\nAapne 60 seconds me response nahi diya, isliye ye request close ho gayi hai.`);
        }
        */
      }

      // Cleanup registry after execution loop concludes
      activeBookingTimers.delete(bookingId);

    } catch (error) {
      console.error(`❌ Error executing booking timeout callback: ${error.message}`);
    }
  }, 60000); // 60,000 milliseconds = 60 Seconds [cite: 80, 250]

  // Map reference cache into storage register hook
  activeBookingTimers.set(bookingId.toString(), timerRef);
};

/**
 * Clear an active timeout timer if the worker accepts/rejects the job manually
 * @param {String} bookingId - Target Booking document ID
 */
export const clearBookingTimeoutTimer = (bookingId) => {
  const timerRef = activeBookingTimers.get(bookingId.toString());
  if (timerRef) {
    clearTimeout(timerRef);
    activeBookingTimers.delete(bookingId.toString());
    console.log(`✅ Reminder Engine: Timeout timer successfully cleared for Booking ${bookingId}`);
    return true;
  }
  return false;
};