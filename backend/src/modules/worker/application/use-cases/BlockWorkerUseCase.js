// backend/src/modules/worker/application/use-cases/BlockWorkerUseCase.js

export default class BlockWorkerUseCase {
  constructor(workerRepository) {
    this.workerRepository = workerRepository;
  }

  async execute(workerId) {
    const worker = await this.workerRepository.updateById(
      workerId,
      { isBlocked: true, isAvailable: false }
    );
    if (!worker) throw new Error('Worker not found.');
    return worker;
  }
}
