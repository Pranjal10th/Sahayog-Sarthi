// backend/src/modules/worker/interfaces/http/controllers/WorkerController.js
// Clean HTTP controller — resolves all actions via DI-wired use cases

import {
  approveWorkerKycUseCase,
  rejectWorkerKycUseCase,
  blockWorkerUseCase,
  unblockWorkerUseCase,
  updateWorkerAvailabilityUseCase,
  findNearbyWorkersUseCase,
  getWorkerDashboardUseCase,
  getAdminOverviewUseCase,
} from '../../../infrastructure/di/container.js';

export const getNearbyWorkers = async (req, res) => {
  const { lng, lat, radius, category } = req.query;
  if (!lng || !lat) {
    return res.status(400).json({ error: 'Latitude and Longitude parameters are required.' });
  }
  try {
    const workers = await findNearbyWorkersUseCase.execute(
      parseFloat(lng),
      parseFloat(lat),
      radius ? Number(radius) : 10,
      category || null
    );
    return res.status(200).json({ success: true, count: workers.length, workers });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const getWorkerDashboardData = async (req, res) => {
  try {
    const workerId = req.params.id || req.user?.id;
    const data = await getWorkerDashboardUseCase.execute(workerId);
    return res.status(200).json({ success: true, ...data });
  } catch (err) {
    const status = err.statusCode || 500;
    return res.status(status).json({ success: false, error: err.message });
  }
};

export const approveWorkerKYC = async (req, res) => {
  try {
    const worker = await approveWorkerKycUseCase.execute(req.params.id);
    return res.status(200).json({ success: true, message: 'Worker KYC approved and availability toggled successfully!', worker });
  } catch (err) {
    return res.status(err.message === 'Worker not found.' ? 404 : 500).json({ success: false, error: err.message });
  }
};

export const rejectWorkerKYC = async (req, res) => {
  try {
    const worker = await rejectWorkerKycUseCase.execute(req.params.id);
    return res.status(200).json({ success: true, message: 'Worker KYC rejected successfully!', worker });
  } catch (err) {
    return res.status(err.message === 'Worker not found.' ? 404 : 500).json({ success: false, error: err.message });
  }
};

export const blockWorkerAccount = async (req, res) => {
  try {
    const worker = await blockWorkerUseCase.execute(req.params.id);
    return res.status(200).json({ success: true, message: 'Worker account blocked successfully!', worker });
  } catch (err) {
    return res.status(err.message === 'Worker not found.' ? 404 : 500).json({ success: false, error: err.message });
  }
};

export const unblockWorkerAccount = async (req, res) => {
  try {
    const worker = await unblockWorkerUseCase.execute(req.params.id);
    return res.status(200).json({ success: true, message: 'Worker account unblocked successfully!', worker });
  } catch (err) {
    return res.status(err.message === 'Worker not found.' ? 404 : 500).json({ success: false, error: err.message });
  }
};

export const updateWorkerProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const updatedWorker = await updateWorkerAvailabilityUseCase.execute(id, updateData);
    return res.status(200).json({ success: true, message: 'Sarthi profile updated successfully!', worker: updatedWorker });
  } catch (err) {
    const status = err.statusCode || (err.message.includes('not found') ? 404 : 500);
    return res.status(status).json({ success: false, error: err.message });
  }
};

export const getAdminOverview = async (req, res) => {
  try {
    const data = await getAdminOverviewUseCase.execute();
    return res.status(200).json({ success: true, ...data });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
