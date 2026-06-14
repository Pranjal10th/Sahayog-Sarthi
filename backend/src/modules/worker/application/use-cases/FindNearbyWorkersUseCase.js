// backend/src/modules/worker/application/use-cases/FindNearbyWorkersUseCase.js

export default class FindNearbyWorkersUseCase {
  constructor(locationPort) {
    this.locationPort = locationPort;
  }

  /**
   * @param {number} lng
   * @param {number} lat
   * @param {number} radiusKm - radius in kilometres (converted internally to metres)
   * @param {string|null} category
   * @returns {Promise<Array>} scored & sorted worker list
   */
  async execute(lng, lat, radiusKm = 10, category = null) {
    const radiusInMeters = radiusKm * 1000;

    const workers = await this.locationPort.findNearbyWorkers(lng, lat, radiusInMeters, category);

    // Recommendation scoring algorithm
    const scoredWorkers = workers.map(worker => {
      const actualDistanceKm = worker.distance ? worker.distance / 1000 : 1;
      const maxRadiusKm = radiusKm;
      const distanceScore = Math.max(0, 10 - (actualDistanceKm / maxRadiusKm) * 10);

      const rating = worker.rating || 0;
      const experience = Math.min(10, worker.experience || 0);
      const normalizedRating = rating * 2;
      const recommendationScore = (0.4 * normalizedRating) + (0.3 * experience) + (0.3 * distanceScore);

      const workerObj = worker.toObject ? worker.toObject() : worker;
      return {
        ...workerObj,
        distanceInKm: parseFloat(actualDistanceKm.toFixed(2)),
        recommendationScore: parseFloat(recommendationScore.toFixed(2))
      };
    });

    scoredWorkers.sort((a, b) => b.recommendationScore - a.recommendationScore);
    return scoredWorkers;
  }
}
