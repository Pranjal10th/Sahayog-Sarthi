// backend/src/modules/booking/interfaces/http/controllers/BookingController.js

import {
  createBookingUseCase,
  acceptBookingUseCase,
  startBookingUseCase,
  completeBookingUseCase,
  cancelBookingUseCase,
  getBookingByIdUseCase,
  getBookingHistoryUseCase,
} from '../../../infrastructure/di/container.js';

export const createBooking = async (req, res) => {
  const { workerId, serviceType, amount, customerAddress, notes } = req.body;
  const customerId = req.user?.id || '6a2c1a295ca7ff1dfef3dbcf';

  console.log('🚀 [BOOKING TRIGGERED] Frontend se request received!');
  console.log(`📋 Details -> Worker: ${workerId}, Category: ${serviceType}, Address: ${customerAddress}`);

  try {
    const booking = await createBookingUseCase.execute({ customerId, workerId, serviceType, amount, customerAddress, notes });
    return res.status(201).json({ success: true, booking });
  } catch (err) {
    console.error('❌ Booking creation error:', err);
    return res.status(err.statusCode || 500).json({ error: err.message });
  }
};

export const acceptBooking = async (req, res) => {
  try {
    const booking = await acceptBookingUseCase.execute(req.params.id);
    return res.status(200).json({ success: true, booking });
  } catch (err) {
    return res.status(err.statusCode || 500).json({ error: err.message });
  }
};

export const startBooking = async (req, res) => {
  try {
    const booking = await startBookingUseCase.execute(req.params.id);
    return res.status(200).json({ success: true, booking });
  } catch (err) {
    return res.status(err.statusCode || 500).json({ success: false, error: err.message });
  }
};

export const completeBooking = async (req, res) => {
  try {
    const booking = await completeBookingUseCase.execute(req.params.id);
    return res.status(200).json({ success: true, booking });
  } catch (err) {
    return res.status(err.statusCode || 500).json({ error: err.message });
  }
};

export const cancelBooking = async (req, res) => {
  try {
    const booking = await cancelBookingUseCase.execute(req.params.id);
    return res.status(200).json({ success: true, booking });
  } catch (err) {
    return res.status(err.statusCode || 500).json({ success: false, error: err.message });
  }
};

export const getBookingById = async (req, res) => {
  try {
    const booking = await getBookingByIdUseCase.execute(req.params.id);
    return res.status(200).json({ success: true, booking });
  } catch (err) {
    return res.status(err.statusCode || 500).json({ success: false, error: err.message });
  }
};

export const getBookingHistory = async (req, res) => {
  const { id: userId, role } = req.user;
  const page  = parseInt(req.query.page)  || 1;
  const limit = parseInt(req.query.limit) || 10;
  try {
    const result = await getBookingHistoryUseCase.execute(userId, role, page, limit);
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
