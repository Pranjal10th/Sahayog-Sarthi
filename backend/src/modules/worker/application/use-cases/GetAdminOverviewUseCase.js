export default class GetAdminOverviewUseCase {
  constructor(workerRepository, bookingRepository, paymentRepository, userRepository) {
    this.workerRepository = workerRepository;
    this.bookingRepository = bookingRepository;
    this.paymentRepository = paymentRepository;
    this.userRepository = userRepository;
  }

  async execute() {
    const totalUsers = await this.userRepository.countDocuments({});
    const activeWorkers = await this.workerRepository.countDocuments({ kycStatus: 'approved', isAvailable: true });
    
    const paymentsPaid = await this.paymentRepository.findPaidPayments();
    const platformRevenue = paymentsPaid.reduce((sum, current) => sum + (current.amount * 0.15), 0);

    const pendingWorkers = await this.workerRepository.findWithFilters({ kycStatus: 'pending' });

    const liveBookings = await this.bookingRepository.findLiveBookings();

    return {
      metrics: {
        totalUsers,
        activeWorkers,
        platformRevenue: parseFloat(platformRevenue.toFixed(2))
      },
      pendingWorkers,
      liveBookings
    };
  }
}
