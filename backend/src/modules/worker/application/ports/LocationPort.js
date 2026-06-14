// backend/src/modules/worker/application/ports/LocationPort.js
// Interface describing geospatial search operations

export default class LocationPort {
  /**
   * @param {number} lng
   * @param {number} lat
   * @param {number} radiusInMeters
   * @param {string|null} category
   * @returns {Promise<Array>}
   */
  async findNearbyWorkers(lng, lat, radiusInMeters, category) {
    throw new Error('Not implemented: findNearbyWorkers');
  }
}
