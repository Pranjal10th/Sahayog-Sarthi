// backend/src/routes/worker.js
import express from 'express';
import multer from 'multer';
import path from 'path';
import { 
  getNearbyWorkers, 
  approveWorkerKYC, 
  updateWorkerProfile,
  getWorkerDashboardData
} from '../controllers/workerController.js';
import protect from '../middlewares/authMiddleware.js';

const router = express.Router();

// 1. Configure Multer Disk Storage Configuration Engine
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/kyc/'); // Files storage target local directory path
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// 2. Apply Strict SRS Constraints File Filter (FR-288: Max 5MB, PDF/JPG/PNG only)
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MegaBytes boundary
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Syntax Error: Only PDF, JPG, and PNG documents are allowed!'));
    }
  }
});

// --- CORE MAPPINGS GATES ---
router.get('/nearby', getNearbyWorkers);
router.get('/:id/dashboard', protect, getWorkerDashboardData);
router.put('/:id/approve', approveWorkerKYC);

// FR-02 & FR-288 Multi-part form handler injection layer
router.put('/:id', protect, upload.array('documents', 3), updateWorkerProfile);

export default router;