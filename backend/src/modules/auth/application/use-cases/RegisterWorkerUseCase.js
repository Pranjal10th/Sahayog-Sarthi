import MobileNumber from '../../domain/value-objects/MobileNumber.js';

export default class RegisterWorkerUseCase {
  constructor(workerRepository, tokenService) {
    this.workerRepository = workerRepository;
    this.tokenService = tokenService;
  }

  async execute({ name, mobileStr, serviceCategory, experience, hourlyRate, longitude, latitude }) {
    if (!name || !mobileStr || !serviceCategory || experience === undefined || hourlyRate === undefined || longitude === undefined || latitude === undefined) {
      throw new Error('All fields including GPS coordinates are mandatory.');
    }

    // Validate mobile format via value object
    const mobile = new MobileNumber(mobileStr);

    const existingWorker = await this.workerRepository.findByMobile(mobile.value);
    if (existingWorker) {
      const err = new Error('Worker with this mobile already exists.');
      err.status = 400;
      throw err;
    }

    const worker = await this.workerRepository.create({
      name,
      mobile: mobile.value,
      serviceCategory,
      experience: Number(experience),
      hourlyRate: Number(hourlyRate),
      location: {
        type: 'Point',
        coordinates: [Number(longitude), Number(latitude)]
      },
      kycStatus: 'pending'
    });

    const token = this.tokenService.generate({ id: worker._id || worker.id, role: 'worker' });

    return {
      token,
      worker,
      role: 'worker'
    };
  }
}
