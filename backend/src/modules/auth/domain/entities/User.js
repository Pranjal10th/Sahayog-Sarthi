export default class User {
  constructor({ id, name, mobile, email, profileImage, location, address, isBlocked, createdAt }) {
    this.id = id;
    this.name = name;
    this.mobile = mobile;
    this.email = email;
    this.profileImage = profileImage;
    this.location = location || { type: 'Point', coordinates: [0, 0] };
    this.address = address;
    this.isBlocked = isBlocked || false;
    this.createdAt = createdAt || new Date();
  }

  block() {
    this.isBlocked = true;
  }

  unblock() {
    this.isBlocked = false;
  }
}
