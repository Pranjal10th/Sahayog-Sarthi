// backend/src/modules/payment/infrastructure/persistence/repositories/MongoPaymentRepository.js

import PaymentRepositoryPort from '../../../application/ports/PaymentRepositoryPort.js';
import Payment from '../schemas/PaymentSchema.js';

export default class MongoPaymentRepository extends PaymentRepositoryPort {
  async create(data) {
    return await Payment.create(data);
  }

  async findOne(filter) {
    return await Payment.findOne(filter);
  }

  async findOneAndUpdate(filter, update, options = {}) {
    return await Payment.findOneAndUpdate(filter, update, { new: true, ...options });
  }

  async find(filter, options = {}) {
    return await Payment.find(filter).sort(options.sort || { createdAt: -1 });
  }
}
