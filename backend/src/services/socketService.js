import { Server } from 'socket.io';

let io;
// Active users ke sockets map karne ke liye map stores
const userSockets = new Map(); // userId -> socketId

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*', // Development ke liye open rakhenge
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Naya device connect hua: ${socket.id}`);

    // User/Worker connect hote hi apni ID register karega
    socket.on('join', ({ userId }) => {
      userSockets.set(userId, socket.id);
      console.log(`👤 User ${userId} map hua socket ${socket.id} par`);
    });

    // Worker se live location updates recieve karna (Every 5 seconds)
    socket.on('location:update', ({ bookingId, lat, lng }) => {
      console.log(`📍 Worker Location Update for Booking ${bookingId}: Lat ${lat}, Lng ${lng}`);
      
      // Customer ko directly forward/broadcast karna
      io.to(`booking_${bookingId}`).emit('location:broadcast', {
        lat,
        lng,
        eta: '5 mins' // Baad mein calculate karenge dynamically
      });
    });

    // Booking tracking room join karna
    socket.on('join_booking_room', ({ bookingId }) => {
      socket.join(`booking_${bookingId}`);
      console.log(`🏠 Socket ${socket.id} ne join kiya room: booking_${bookingId}`);
    });

    socket.on('disconnect', () => {
      // Cleanup disconnected sockets
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

// Global helper dusre controllers se event emit karne ke liye
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