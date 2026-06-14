// backend/src/modules/worker/application/use-cases/UpdateWorkerAvailabilityUseCase.js

export default class UpdateWorkerAvailabilityUseCase {
  constructor(workerRepository) {
    this.workerRepository = workerRepository;
  }

  /**
   * @param {string} workerId
   * @param {Object} updateData - profile fields from request body
   * @returns {Promise<Object>}
   */
  async execute(workerId, updateData) {
    // Fetch first to check blocked constraint
    const existing = await this.workerRepository.findById(workerId);
    if (!existing) throw new Error('Worker profile not found.');

    // Business rule: Blocked worker cannot toggle availability to online
    if (existing.isBlocked && updateData.isAvailable === true) {
      const err = new Error('Blocked workers cannot make themselves available.');
      err.statusCode = 403;
      throw err;
    }

    const updated = await this.workerRepository.updateById(workerId, { $set: updateData });
    if (!updated) throw new Error('Worker profile not found during update.');
    return updated;
  }
}
