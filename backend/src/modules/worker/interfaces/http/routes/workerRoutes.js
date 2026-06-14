// backend/src/modules/worker/interfaces/http/routes/workerRoutes.js
// Clean module router — mirrors legacy src/routes/worker.js routing structure

import express from 'express';
import multer from 'multer';
import path from 'path';
import protect, { restrictTo } from '../../../../../middlewares/authMiddleware.js';
import {
  getNearbyWorkers,
  getWorkerDashboardData,
  approveWorkerKYC,
  rejectWorkerKYC,
  blockWorkerAccount,
  unblockWorkerAccount,
  updateWorkerProfile,
  getAdminOverview,
} from '../controllers/WorkerController.js';

const router = express.Router();

// --- Multer file upload configuration (KYC documents) ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => { cb(null, 'uploads/kyc/'); },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|pdf/;
    if (allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, JPG, and PNG documents are allowed!'));
    }
  },
});

// --- Routes ---
router.get('/nearby',               getNearbyWorkers);
router.get('/admin/overview',       protect, restrictTo('admin'), getAdminOverview);
router.get('/:id/dashboard',        protect, getWorkerDashboardData);
router.put('/:id/approve',          protect, restrictTo('admin'), approveWorkerKYC);
router.put('/:id/reject',           protect, restrictTo('admin'), rejectWorkerKYC);
router.put('/:id/block',            protect, restrictTo('admin'), blockWorkerAccount);
router.put('/:id/unblock',          protect, restrictTo('admin'), unblockWorkerAccount);
router.put('/:id',                  protect, upload.array('documents', 3), updateWorkerProfile);

export default router;
