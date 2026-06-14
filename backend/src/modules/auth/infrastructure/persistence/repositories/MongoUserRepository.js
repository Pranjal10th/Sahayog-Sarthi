import UserRepositoryPort from '../../../application/ports/UserRepositoryPort.js';
import UserSchema from '../schemas/UserSchema.js';
import UserMapper from '../mappers/UserMapper.js';

export default class MongoUserRepository extends UserRepositoryPort {
  async findByMobile(mobile) {
    const doc = await UserSchema.findOne({ mobile });
    return UserMapper.toDomain(doc);
  }

  async findById(id) {
    const doc = await UserSchema.findById(id);
    return UserMapper.toDomain(doc);
  }

  async create(userData) {
    const doc = await UserSchema.create(userData);
    return UserMapper.toDomain(doc);
  }

  async save(userEntity) {
    const data = UserMapper.toPersistence(userEntity);
    const doc = await UserSchema.findByIdAndUpdate(userEntity.id, data, { new: true });
    return UserMapper.toDomain(doc);
  }
}
