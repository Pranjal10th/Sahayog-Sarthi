import express from 'express';
import { createPaymentOrder, verifyPaymentSignature } from '../controllers/paymentController.js';
import protect from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/create-order', protect, createPaymentOrder); 
router.post('/verify', protect, verifyPaymentSignature);    

// Export hook mapping for index.js configuration
export default router;