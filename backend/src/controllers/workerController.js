import * as locationService from '../services/locationService.js';
import Worker from '../models/Worker.js';

// 1. Fetch nearby workers based on coordinates
export const getNearbyWorkers = async (req, res) => {
  const { lng, lat, radius, category } = req.query;

  if (!lng || !lat) {
    return res.status(400).json({ error: 'Latitude and Longitude parameters are required.' });
  }

  try {
    // Radius ko meters mein badlo (default 10km = 10000m)
    const radiusInMeters = radius ? Number(radius) * 1000 : 10000;

    const workers = await locationService.findNearbyWorkers(
      lng, 
      lat, 
      radiusInMeters, 
      category
    );

    return res.status(200).json({
      success: true,
      count: workers.length,
      workers
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// 2. Admin Route Simulator: Quick worker KYC approval (Testing ke liye)
export const approveWorkerKYC = async (req, res) => {
  const { id } = req.params;

  try {
    const worker = await Worker.findByIdAndUpdate(
      id, 
      { kycStatus: 'approved', isAvailable: true }, 
      { new: true }
    );

    if (!worker) return res.status(404).json({ error: 'Worker not found.' });

    return res.status(200).json({ 
      message: 'Worker KYC approved and toggled online successfully!', 
      worker 
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};