// backend/src/models/Worker.js (Backward Compatibility Proxy Wrapper)
// All imports of `../models/Worker.js` now resolve to the canonical schema
// defined in the clean Worker module. This eliminates mongoose overwrite warnings
// and ensures a single source of truth for the Worker collection schema.
import Worker from '../modules/worker/infrastructure/persistence/schemas/WorkerSchema.js';
export default Worker;