import WorkerRepositoryPort from '../../../application/ports/WorkerRepositoryPort.js';
import Worker from '../../../../../models/Worker.js';

export default class MongoWorkerRepository extends WorkerRepositoryPort {
  async findByMobile(mobile) {
    return await Worker.findOne({ mobile });
  }

  async create(workerData) {
    return await Worker.create(workerData);
  }
}
