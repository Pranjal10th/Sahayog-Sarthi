import express from 'express';
import { getNearbyWorkers, approveWorkerKYC } from '../controllers/workerController.js';

const router = express.Router();

router.get('/nearby', getNearbyWorkers); // /api/v1/workers/nearby
router.put('/:id/approve', approveWorkerKYC); // For internal testing flow

export default router;