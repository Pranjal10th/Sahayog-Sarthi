// backend/src/models/Payment.js (Backward Compatibility Proxy Wrapper)
// All imports of `../models/Payment.js` now resolve to the canonical schema
// defined in the clean Payment module. This eliminates duplicate schema
// definitions and ensures a single source of truth for the Payment collection.
import Payment from '../modules/payment/infrastructure/persistence/schemas/PaymentSchema.js';
export default Payment;