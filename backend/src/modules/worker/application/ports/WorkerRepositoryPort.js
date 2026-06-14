// backend/src/modules/worker/application/ports/WorkerRepositoryPort.js
// Interface that all concrete Worker repositories must implement

export default class WorkerRepositoryPort {
  async findById(id)                        { throw new Error('Not implemented: findById'); }
  async findByMobile(mobile)                { throw new Error('Not implemented: findByMobile'); }
  async create(workerData)                  { throw new Error('Not implemented: create'); }
  async updateById(id, updateData)          { throw new Error('Not implemented: updateById'); }
  async findNearby(coordinates, radiusMeters, filters) { throw new Error('Not implemented: findNearby'); }
  async findWithFilters(filters)            { throw new Error('Not implemented: findWithFilters'); }
  async countDocuments(filters)             { throw new Error('Not implemented: countDocuments'); }
}
