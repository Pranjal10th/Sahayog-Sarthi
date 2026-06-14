// backend/src/modules/worker/application/use-cases/GetWorkerDashboardUseCase.js

export default class GetWorkerDashboardUseCase {
  constructor(workerRepository, bookingRepository, paymentRepository) {
    this.workerRepository = workerRepository;
    this.bookingRepository = bookingRepository;
    this.paymentRepository = paymentRepository;
  }

  /**
   * @param {string} workerId
   * @returns {Promise<Object>} dashboard analytics, active bookings, and transaction logs
   */
  async execute(workerId) {
    const worker = await this.workerRepository.findById(workerId);
    if (!worker) {
      const err = new Error('Sarthi profile execution context not found.');
      err.statusCode = 404;
      throw err;
    }

    // Active bookings (accepted & in_progress)
    const activeBookings = await this.bookingRepository.findActiveForWorker(workerId);

    // Recent 10 payment transactions linked to worker bookings
    const transactions = await this.paymentRepository.findRecentForWorker(workerId);

    return {
      analytics: {
        walletBalance: worker.walletBalance,
        rating: worker.rating,
        totalRatings: worker.totalRatings,
        isAvailable: worker.isAvailable,
        kycStatus: worker.kycStatus,
      },
      activeBookings,
      transactions,
    };
  }
}
