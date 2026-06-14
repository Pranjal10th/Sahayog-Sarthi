// backend/src/modules/worker/infrastructure/persistence/mappers/WorkerMapper.js
// Converts between Mongoose documents and domain entities

import WorkerEntity from '../../../domain/entities/Worker.js';

export default class WorkerMapper {
  static toDomain(doc) {
    if (!doc) return null;
    const raw = doc.toObject ? doc.toObject() : doc;
    return new WorkerEntity({
      id:              raw._id?.toString(),
      name:            raw.name,
      mobile:          raw.mobile,
      serviceCategory: raw.serviceCategory,
      experience:      raw.experience,
      rating:          raw.rating,
      totalRatings:    raw.totalRatings,
      location:        raw.location,
      isAvailable:     raw.isAvailable,
      kycStatus:       raw.kycStatus,
      documents:       raw.documents,
      walletBalance:   raw.walletBalance,
      hourlyRate:      raw.hourlyRate,
      isBlocked:       raw.isBlocked,
      telegramChatId:  raw.telegramChatId,
      createdAt:       raw.createdAt,
      updatedAt:       raw.updatedAt,
    });
  }

  // Return the raw Mongoose doc for use in controllers that need full Mongoose doc shape
  static toRaw(doc) {
    return doc;
  }
}
