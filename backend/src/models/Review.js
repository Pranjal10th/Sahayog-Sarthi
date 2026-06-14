// backend/src/models/Review.js (Backward Compatibility Proxy Wrapper)
// All imports of `../models/Review.js` now resolve to the canonical schema
// defined in the clean Review module. This eliminates duplicate schema
// definitions and ensures a single source of truth for the Review collection.
import Review from '../modules/review/infrastructure/persistence/schemas/ReviewSchema.js';
export default Review;