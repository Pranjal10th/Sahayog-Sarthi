// backend/src/models/Booking.js (Backward Compatibility Proxy Wrapper)
// All imports of `../models/Booking.js` now resolve to the canonical schema
// defined in the clean Booking module. This eliminates duplicate schema
// definitions and ensures a single source of truth for the Booking collection.
import Booking from '../modules/booking/infrastructure/persistence/schemas/BookingSchema.js';
export default Booking;