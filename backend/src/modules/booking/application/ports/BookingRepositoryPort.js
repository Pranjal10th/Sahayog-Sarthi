// backend/src/modules/booking/application/ports/BookingRepositoryPort.js

export default class BookingRepositoryPort {
  async create(data)                       { throw new Error('Not implemented: create'); }
  async findById(id)                       { throw new Error('Not implemented: findById'); }
  async findByIdAndUpdate(id, update)      { throw new Error('Not implemented: findByIdAndUpdate'); }
  async findWithFilter(filter, opts)       { throw new Error('Not implemented: findWithFilter'); }
  async countDocuments(filter)             { throw new Error('Not implemented: countDocuments'); }
}
