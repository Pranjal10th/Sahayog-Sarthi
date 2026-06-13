import { Server } from 'socket.io';
import Worker from '../models/Worker.js';
import Chat from '../models/Chat.js'; // INJECTED MIGRATION BACKUP MODEL

let io;
const userSockets = new Map(); // userId -> socketId

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Naya device connect hua: ${socket.id}`);

    socket.on('join', ({ userId }) => {
      userSockets.set(userId, socket.id);
      console.log(`👤 User ${userId} map hua socket ${socket.id} par`);
    });

    // Worker live location handler
    socket.on('location:update', async ({ bookingId, workerId, lat, lng }) => {
      if (workerId) {
        try {
          await Worker.findByIdAndUpdate(workerId, {
            location: {
              type: 'Point',
              coordinates: [parseFloat(lng), parseFloat(lat)]
            }
          });
        } catch (error) {
          console.error(`❌ MongoDB coordinates background sync failure: ${error.message}`);
        }
      }

      io.to(`booking_${bookingId}`).emit('location:broadcast', {
        lat,
        lng,
        eta: '5 mins'
      });
    });

    // Join Booking Tracking/Communication Room
    socket.on('join_booking_room', ({ bookingId }) => {
      socket.join(`booking_${bookingId}`);
      console.log(`🏠 Socket ${socket.id} joined room: booking_${bookingId}`);
    });

    // =========================================================================
    // 💬 REAL-TIME DUPLEX CHAT CHANNEL INJECTION (SRS SECTION 12 STEP 6)
    // =========================================================================
    socket.on('chat:message', async ({ bookingId, senderId, senderModel, message }) => {
      console.log(`✉️ Message Received for Room booking_${bookingId}: ${message}`);

      try {
        // 1. Write message packet into MongoDB Atlas cluster for persistence logs
        const newChatLog = await Chat.create({
          bookingId,
          senderId,
          senderModel,
          message
        });

        // 2. Broadcast message instance directly to the opposite party in the room
        io.to(`booking_${bookingId}`).emit('chat:message_broadcast', {
          _id: newChatLog._id,
          bookingId,
          senderId,
          senderModel,
          message,
          timestamp: newChatLog.timestamp
        });

      } catch (err) {
        console.error(`❌ Chat persistence pipeline drop: ${err.message}`);
      }
    });

    socket.on('disconnect', () => {
      for (let [userId, socketId] of userSockets.entries()) {
        if (socketId === socket.id) {
          userSockets.delete(userId);
          console.log(`❌ User ${userId} disconnected`);
          break;
        }
      }
    });
  });

  return io;
};

const getIoInstance = () => {
  if (!io) throw new Error("Socket.io initialized nahi hai!");
  return io;
};

export const emitToUser = (userId, event, data) => {
  const socketId = userSockets.get(userId);
  if (socketId) {
    getIoInstance().to(socketId).emit(event, data);
    return true;
  }
  return false;
};

export const emitToRoom = (roomName, event, data) => {
  getIoInstance().to(roomName).emit(event, data);
};