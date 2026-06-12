import Worker from '../models/Worker.js';

export const findNearbyWorkers = async (lng, lat, radiusInMeters = 10000, category = null) => {
  try {
    // Basic query pipeline filters for active and approved workers
    const matchQuery = {
      isAvailable: true,
      kycStatus: 'approved'
    };

    // Agar user ne specific category (like Plumber) filter lagaya ho
    if (category) {
      matchQuery.serviceCategory = category;
    }

    // Dynamic MongoDB Aggregation Pipeline using 2dsphere index
    const workers = await Worker.aggregate([
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [Number(lng), Number(lat)] },
          distanceField: 'distance', // Metres mein distance calculate karega
          maxDistance: Number(radiusInMeters),
          query: matchQuery,
          spherical: true
        }
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
          // Distance ko metres se km mein convert karke round off kar rhe hain
          distanceInKm: { $round: [{ $divide: ['$distance', 1000] }, 2] },
          // Estimated time of arrival (ETA) calculation (Avg speed 30km/h ke hisab se)
          estimatedArrivalTimeMins: { $round: [{ $multiply: [{ $divide: ['$distance', 1000] }, 2] }, 0] }
        }
      }
    ]);

    return workers;
  } catch (error) {
    throw new Error(`Geospatial Query Failed: ${error.message}`);
  }
};