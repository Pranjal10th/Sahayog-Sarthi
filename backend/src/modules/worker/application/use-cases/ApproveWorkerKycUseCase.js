// backend/src/modules/worker/application/use-cases/ApproveWorkerKycUseCase.js

export default class ApproveWorkerKycUseCase {
  constructor(workerRepository) {
    this.workerRepository = workerRepository;
  }

  async execute(workerId) {
    const worker = await this.workerRepository.updateById(
      workerId,
      { kycStatus: 'approved', isAvailable: true }
    );
    if (!worker) throw new Error('Worker not found.');
    return worker;
  }
}
