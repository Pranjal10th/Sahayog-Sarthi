import TelegramBot from 'node-telegram-bot-api';
import Booking from '../models/Booking.js';
import Worker from '../models/Worker.js';

const token = process.env.TELEGRAM_BOT_TOKEN;
let bot;

// Initialize bot execution safely
if (token) {
  bot = new TelegramBot(token, { polling: true });
  console.log("🤖 Telegram Alert Bot initialized and polling active network...");
}

// 1. Worker Identification registration handler (/start command)
if (bot) {
  bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    
    const welcomeMessage = `
👋 *Welcome Sarthi to Sahayog Control Bot!*

Aapka unique Telegram Chat ID hai: \`${chatId}\`

*How to map your profile:*
Isko copy karke apne Worker Profile Dashboard par save kar lijiye taaki saari real-time local customer customer requests aapko seedhe yahan mil sakein!
    `;
    
    bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
  });

  // 2. Dynamic Inline Buttons Action Trigger Listener (Accept / Reject Hooks)
  bot.on('callback_query', async (callbackQuery) => {
    const action = callbackQuery.data; // Structure: "accept_bookingId" or "reject_bookingId"
    const chatId = callbackQuery.message.chat.id;
    const messageId = callbackQuery.message.message_id;

    const [status, bookingId] = action.split('_');

    try {
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        return bot.answerCallbackQuery(callbackQuery.id, { text: "Booking session closed or missing.", show_alert: true });
      }

      if (booking.status !== 'pending') {
        return bot.answerCallbackQuery(callbackQuery.id, { text: `Yeh job already kisi aur ne ${booking.status} kar li hai!`, show_alert: true });
      }

      if (status === 'accept') {
        // State Machine modification on MongoDB database cluster
        booking.status = 'accepted';
        await booking.save();

        bot.answerCallbackQuery(callbackQuery.id, { text: "🎉 Job Accepted successfully!" });
        
        // UI message update mapping state
        bot.editMessageText(`✅ *You accepted this job!*\n\n📍 *Customer Address:* ${booking.customerAddress}\n💰 *Earnings:* ₹${booking.amount}`, {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'Markdown'
        });

        console.log(`⚡ [SOCKET LINK] Dispatching booking:accepted signal over room channel for: ${bookingId}`);
        
        // =========================================================================
        // CRITICAL REAL-TIME ALIGNMENT FIX: Dynamic import to avoid circular dependency
        // This fires the event straight into the customer's active live room.
        // =========================================================================
        import('./socketService.js')
          .then((socketService) => {
            // Emitting to the specific booking tracking room channel
            socketService.emitToRoom(`booking_${bookingId}`, 'booking:accepted', {
              bookingId: booking._id,
              status: 'accepted'
            });
            console.log(`✅ [SOCKET SERVICE] Real-time loop broadcasted to room: booking_${bookingId}`);
          })
          .catch((err) => console.error("❌ Failed to broadcast socket event from telegram worker container:", err));
        // =========================================================================

      } else {
        bot.answerCallbackQuery(callbackQuery.id, { text: "Job request dismissed." });
        bot.deleteMessage(chatId, messageId);
      }
    } catch (err) {
      console.error("Error in telegram callback query handler:", err);
    }
  });
}

// 3. Central Dispatcher Utility Engine (Isko controllers use karenge alert push karne ke liye)
export const sendBookingAlertToWorker = async (workerTelegramChatId, booking) => {
  if (!bot || !workerTelegramChatId) return;

  const alertTemplate = `
🚨 *NEW JOB DISPATCH ALERT!*

🛠️ *Category:* ${booking.serviceType}
📍 *Location:* ${booking.customerAddress}
💰 *Est. Pay:* ₹${booking.amount}
📝 *Instructions:* ${booking.notes || 'None'}

Aap is service request ko accept karna chahte hain?
  `;

  const inlineKeyboardConfig = {
    reply_markup: {
      inline_keyboard: [
        [
          // Standard callback_data tags
          { text: '✅ Accept Request', callback_data: `accept_${booking._id}` },
          { text: '❌ Dismiss', callback_data: `reject_${booking._id}` }
        ]
      ]
    },
    parse_mode: 'Markdown'
  };

  bot.sendMessage(workerTelegramChatId, alertTemplate, inlineKeyboardConfig);
};