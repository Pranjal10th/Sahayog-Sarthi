// backend/src/middlewares/validationMiddleware.js
import { body, validationResult } from 'express-validator';

// Standard error builder gate callback
export const validateFieldsResult = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Return early if any structural data mismatch fields violate guidelines
    return res.status(400).json({ 
      success: false, 
      error: errors.array()[0].msg // Send the first explicit error message string
    });
  }
  next();
};

// 1. Structural parameters verification rules template for creating bookings [cite: 141]
export const validateBookingCreation = [
  body('workerId')
    .isMongoId().withMessage('Invalid reference identifier format for Sarthi node mapping.'),
  body('serviceType')
    .notEmpty().withMessage('Service Type framework category cannot be empty string fields.'),
  body('amount')
    .optional()
    .isNumeric().withMessage('Task Price fee metrics values must be standard numbers.'),
  body('customerAddress')
    .notEmpty().withMessage('Strict Rule Validation: Destination address field is mandatory.'),
  validateFieldsResult
];

// 2. Verification rules template for logging raw review feeds [cite: 145]
export const validateReviewSubmission = [
  body('bookingId')
    .isMongoId().withMessage('Invalid reference identifier format for targeted booking session.'),
  body('rating')
    .isInt({ min: 1, max: 5 }).withMessage('Evaluation parameter mismatch: Rating bounds must be 1-5 stars.'),
  body('comment')
    .optional()
    .isString().withMessage('Comments parameters notes must pass standard string checks.'),
  validateFieldsResult
];