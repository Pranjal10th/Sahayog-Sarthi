// backend/src/modules/worker/infrastructure/persistence/adapters/MongoLocationAdapter.js
// Concrete implementation of LocationPort using MongoDB $geoNear aggregation

import LocationPort from '../../../application/ports/LocationPort.js';
import Worker from '../schemas/WorkerSchema.js';

export default class MongoLocationAdapter extends LocationPort {

  async findNearbyWorkers(lng, lat, radiusInMeters, category = null) {
    const matchQuery = {
      isAvailable: true,
      kycStatus: 'approved',
      isBlocked: { $ne: true },
    };

    if (category) {
      matchQuery.serviceCategory = category;
    }

    const workers = await Worker.aggregate([
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [Number(lng), Number(lat)] },
          distanceField: 'distance',
          maxDistance: Number(radiusInMeters),
          query: matchQuery,
          spherical: true,
        },
      },
      {
        $project: {
          name: 1,
          mobile: 1,
          serviceCategory: 1,
          experience: 1,
          rating: 1,
          hourlyRate: 1,
          isAvailable: 1,
          distance: 1,
          distanceInKm: { $round: [{ $divide: ['$distance', 1000] }, 2] },
          estimatedArrivalTimeMins: { $round: [{ $multiply: [{ $divide: ['$distance', 1000] }, 2] }, 0] },
        },
      },
    ]);

    return workers;
  }
}
