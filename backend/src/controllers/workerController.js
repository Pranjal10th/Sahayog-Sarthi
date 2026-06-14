// backend/src/controllers/workerController.js

import * as locationService from '../services/locationService.js';
import Worker from '../models/Worker.js';
import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';
import User from '../models/User.js';

// 1. Fetch nearby workers based on coordinates + Recommendation Scoring Engine
export const getNearbyWorkers = async (req, res) => {
  const { lng, lat, radius, category } = req.query;

  if (!lng || !lat) {
    return res.status(400).json({ error: 'Latitude and Longitude parameters are required.' });
  }

  try {
    // Radius ko meters mein badlo (default 10km = 10000m) [cite: 74, 244]
    const radiusInMeters = radius ? Number(radius) * 1000 : 10000;

    // Geospatial query execution [cite: 244]
    const workers = await locationService.findNearbyWorkers(
      lng, 
      lat, 
      radiusInMeters, 
      category
    );

    // Phase 7: Dynamic Worker Recommendation Engine Scoring Algorithm 
    const scoredWorkers = workers.map(worker => {
      // 1. Distance Score Calculation (Inverted logic: Closer distance = Higher score)
      const actualDistanceKm = worker.distance ? worker.distance / 1000 : 1;
      const maxRadiusKm = radiusInMeters / 1000;
      const distanceScore = Math.max(0, 10 - (actualDistanceKm / maxRadiusKm) * 10); // Scale of 0-10

      // 2. Extracted Metrics
      const rating = worker.rating || 0; // Scale 0-5 [cite: 137]
      const experience = Math.min(10, worker.experience || 0); // Scale 0-10 (capped at 10 years)

      // Normalize Rating to match 0-10 scale metrics for absolute equilibrium
      const normalizedRating = rating * 2; 

      // 3. Formula Execution: Score = (0.4 * Rating) + (0.3 * Experience) + (0.3 * DistanceScore) 
      const recommendationScore = (0.4 * normalizedRating) + (0.3 * experience) + (0.3 * distanceScore);

      // Convert Document to plain JS object to safely append raw dynamic parameters
      const workerObj = worker.toObject ? worker.toObject() : worker;
      return {
        ...workerObj,
        distanceInKm: parseFloat(actualDistanceKm.toFixed(2)),
        recommendationScore: parseFloat(recommendationScore.toFixed(2))
      };
    });

    // Score ke mapping index base par high to low order sorting lagao 
    scoredWorkers.sort((a, b) => b.recommendationScore - a.recommendationScore);

    return res.status(200).json({
      success: true,
      count: scoredWorkers.length,
      workers: scoredWorkers
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// 2. Fetch Dashboard Telemetry & Wallet Ledger for a Sarthi
export const getWorkerDashboardData = async (req, res) => {
  try {
    const workerId = req.params.id || req.user.id;

    // 1. Fetch Profile & Live Balances [cite: 137]
    const worker = await Worker.findById(workerId).select('-documents');
    if (!worker) {
      return res.status(404).json({ success: false, error: 'Sarthi profile execution context not found.' });
    }

    // 2. Fetch Active Operations/Bookings (Accepted & In-Progress) [cite: 141, 250]
    const activeBookings = await Booking.find({
      workerId,
      status: { $in: ['accepted', 'in_progress'] }
    }).populate('customerId', 'name mobile profileImage');

    // 3. Fetch Wallet Ledger History (Recent 10 payouts/withdrawals) [cite: 143]
    const transactions = await Payment.find({ bookingId: { $in: await Booking.find({ workerId }).distinct('_id') } })
      .sort({ createdAt: -1 })
      .limit(10);

    return res.status(200).json({
      success: true,
      analytics: {
        walletBalance: worker.walletBalance,
        rating: worker.rating,
        totalRatings: worker.totalRatings,
        isAvailable: worker.isAvailable,
        kycStatus: worker.kycStatus
      },
      activeBookings,
      transactions
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// 3. Admin Route Simulator: Quick worker KYC decision (Approve/Reject/Block/Unblock)
export const approveWorkerKYC = async (req, res) => {
  const { id } = req.params;
  try {
    const worker = await Worker.findByIdAndUpdate(
      id, 
      { kycStatus: 'approved', isAvailable: true },
      { new: true }
    );
    if (!worker) return res.status(404).json({ success: false, error: 'Worker not found.' });
    return res.status(200).json({ 
      success: true,
      message: 'Worker KYC approved and availability toggled successfully!', 
      worker 
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const rejectWorkerKYC = async (req, res) => {
  const { id } = req.params;
  try {
    const worker = await Worker.findByIdAndUpdate(
      id, 
      { kycStatus: 'rejected', isAvailable: false },
      { new: true }
    );
    if (!worker) return res.status(404).json({ success: false, error: 'Worker not found.' });
    return res.status(200).json({ 
      success: true,
      message: 'Worker KYC rejected successfully!', 
      worker 
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const blockWorkerAccount = async (req, res) => {
  const { id } = req.params;
  try {
    const worker = await Worker.findByIdAndUpdate(
      id, 
      { isBlocked: true, isAvailable: false },
      { new: true }
    );
    if (!worker) return res.status(404).json({ success: false, error: 'Worker not found.' });
    return res.status(200).json({ 
      success: true,
      message: 'Worker account blocked successfully!', 
      worker 
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const unblockWorkerAccount = async (req, res) => {
  const { id } = req.params;
  try {
    const worker = await Worker.findByIdAndUpdate(
      id, 
      { isBlocked: false },
      { new: true }
    );
    if (!worker) return res.status(404).json({ success: false, error: 'Worker not found.' });
    return res.status(200).json({ 
      success: true,
      message: 'Worker account unblocked successfully!', 
      worker 
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// 4. Admin Module Data Hub Core Aggregator (FR-27: Live Dashboard Metrics) [cite: 103]
export const getAdminOverviewHub = async (req, res) => {
  try {
    // A. Perform counts calculations atomically across system nodes
    const totalUsers = await User.countDocuments();
    const activeWorkers = await Worker.countDocuments({ kycStatus: 'approved', isAvailable: true });
    
    // B. Calculate 15% system split commissions from completed settlements records [cite: 143]
    const paymentsPaid = await Payment.find({ status: 'paid' });
    const platformRevenue = paymentsPaid.reduce((sum, current) => sum + (current.amount * 0.15), 0);

    // C. Fetch unverified pending applications queue pipeline [cite: 137]
    const pendingWorkers = await Worker.find({ kycStatus: 'pending' });

    // D. Fetch active real-time tracking transaction logs [cite: 141]
    const liveBookings = await Booking.find({ 
      status: { $in: ['pending', 'accepted', 'in_progress'] } 
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      metrics: {
        totalUsers,
        activeWorkers,
        platformRevenue: parseFloat(platformRevenue.toFixed(2))
      },
      pendingWorkers,
      liveBookings
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// 5. Worker ki profile aur telegramChatId update karne ke liye clean handler
export const updateWorkerProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body; 

    const updatedWorker = await Worker.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true } 
    );

    if (!updatedWorker) {
      return res.status(404).json({ success: false, error: 'Worker profile nahi mili.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Sarthi profile updated successfully over MongoDB node cluster!',
      worker: updatedWorker
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};