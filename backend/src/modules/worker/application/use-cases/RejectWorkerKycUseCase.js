// backend/src/modules/worker/application/use-cases/RejectWorkerKycUseCase.js

export default class RejectWorkerKycUseCase {
  constructor(workerRepository) {
    this.workerRepository = workerRepository;
  }

  async execute(workerId) {
    const worker = await this.workerRepository.updateById(
      workerId,
      { kycStatus: 'rejected', isAvailable: false }
    );
    if (!worker) throw new Error('Worker not found.');
    return worker;
  }
}
