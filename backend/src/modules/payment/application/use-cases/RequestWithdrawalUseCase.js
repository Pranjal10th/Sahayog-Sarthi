// backend/src/modules/payment/application/use-cases/RequestWithdrawalUseCase.js

export default class RequestWithdrawalUseCase {
  constructor(paymentRepository, workerRepository) {
    this.paymentRepository = paymentRepository;
    this.workerRepository = workerRepository;
  }

  async execute({ amount, workerId, role }) {
    if (role !== 'worker') {
      const err = new Error('Only registered workers can request withdrawals.');
      err.statusCode = 403;
      throw err;
    }

    if (!amount || amount <= 0) {
      const err = new Error('Please specify a valid withdrawal amount.');
      err.statusCode = 400;
      throw err;
    }

    const worker = await this.workerRepository.findById(workerId);
    if (!worker) {
      const err = new Error('Worker profile not found.');
      err.statusCode = 404;
      throw err;
    }

    if (worker.walletBalance < amount) {
      const err = new Error('Insufficient wallet balance for withdrawal.');
      err.statusCode = 400;
      throw err;
    }

    // Deduct from worker's wallet balance
    const updatedWorker = await this.workerRepository.updateById(workerId, {
      $inc: { walletBalance: -amount }
    });

    // Create withdrawal transaction record in Payment collection
    const transaction = await this.paymentRepository.create({
      workerId,
      amount,
      platformFee: 0,
      workerAmount: amount,
      status: 'withdrawal_completed', // Simulating instant payout approval for beta/dev sandbox
      paymentMethod: 'bank_transfer',
      transactionType: 'withdrawal'
    });

    return {
      success: true,
      message: 'Withdrawal processed successfully!',
      transaction,
      newBalance: updatedWorker.walletBalance
    };
  }
}
