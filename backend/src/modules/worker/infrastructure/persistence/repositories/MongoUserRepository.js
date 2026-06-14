import User from '../../../../../models/User.js';

export default class MongoUserRepository {
  async countDocuments(filters = {}) {
    return await User.countDocuments(filters);
  }
}
