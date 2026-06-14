// backend/src/modules/worker/application/use-cases/UnblockWorkerUseCase.js

export default class UnblockWorkerUseCase {
  constructor(workerRepository) {
    this.workerRepository = workerRepository;
  }

  async execute(workerId) {
    const worker = await this.workerRepository.updateById(
      workerId,
      { isBlocked: false }
    );
    if (!worker) throw new Error('Worker not found.');
    return worker;
  }
}
