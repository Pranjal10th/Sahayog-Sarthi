// backend/src/modules/worker/domain/entities/Worker.js
// Pure domain entity - no Mongoose or infrastructure dependencies

export default class WorkerEntity {
  constructor({ id, name, mobile, serviceCategory, experience, rating, totalRatings, location, isAvailable, kycStatus, documents, walletBalance, hourlyRate, isBlocked, telegramChatId, createdAt, updatedAt }) {
    this.id = id;
    this.name = name;
    this.mobile = mobile;
    this.serviceCategory = serviceCategory;
    this.experience = experience;
    this.rating = rating ?? 0.0;
    this.totalRatings = totalRatings ?? 0;
    this.location = location; // { type: 'Point', coordinates: [lng, lat] }
    this.isAvailable = isAvailable ?? false;
    this.kycStatus = kycStatus ?? 'pending'; // 'pending' | 'approved' | 'rejected'
    this.documents = documents ?? [];
    this.walletBalance = walletBalance ?? 0;
    this.hourlyRate = hourlyRate;
    this.isBlocked = isBlocked ?? false;
    this.telegramChatId = telegramChatId ?? null;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  isEligibleForDispatch() {
    return this.isAvailable && this.kycStatus === 'approved' && !this.isBlocked;
  }

  canSetAvailable() {
    return !this.isBlocked;
  }
}
