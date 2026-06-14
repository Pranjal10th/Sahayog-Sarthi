import User from '../../../domain/entities/User.js';

export default class UserMapper {
  static toDomain(doc) {
    if (!doc) return null;
    
    // Support both mongoose document and plain object
    const id = doc._id ? doc._id.toString() : doc.id;
    
    return new User({
      id,
      name: doc.name,
      mobile: doc.mobile,
      email: doc.email,
      profileImage: doc.profileImage,
      location: doc.location ? {
        type: doc.location.type,
        coordinates: doc.location.coordinates
      } : null,
      address: doc.address,
      isBlocked: doc.isBlocked,
      createdAt: doc.createdAt
    });
  }

  static toPersistence(entity) {
    if (!entity) return null;
    return {
      name: entity.name,
      mobile: entity.mobile,
      email: entity.email,
      profileImage: entity.profileImage,
      location: entity.location,
      address: entity.address,
      isBlocked: entity.isBlocked,
      createdAt: entity.createdAt
    };
  }
}
