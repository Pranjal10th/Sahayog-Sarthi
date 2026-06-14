// backend/src/modules/worker/infrastructure/persistence/repositories/MongoWorkerRepository.js
// Concrete Mongoose implementation of WorkerRepositoryPort

import WorkerRepositoryPort from '../../../application/ports/WorkerRepositoryPort.js';
import Worker from '../schemas/WorkerSchema.js';

export default class MongoWorkerRepository extends WorkerRepositoryPort {

  async findById(id) {
    return await Worker.findById(id).select('-documents');
  }

  async findByMobile(mobile) {
    return await Worker.findOne({ mobile });
  }

  async create(workerData) {
    return await Worker.create(workerData);
  }

  async updateById(id, updateData) {
    return await Worker.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
  }

  async findNearby(coordinates, radiusMeters, filters = {}) {
    // Delegates raw geo aggregation to the schema directly
    // (used by MongoLocationAdapter)
    return await Worker.find(filters).limit(50);
  }

  async findWithFilters(filters) {
    return await Worker.find(filters);
  }

  async countDocuments(filters = {}) {
    return await Worker.countDocuments(filters);
  }
}
