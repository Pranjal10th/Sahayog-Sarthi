export default class MobileNumber {
  constructor(value) {
    if (!value || typeof value !== 'string' || value.trim().length !== 10) {
      throw new Error('Please provide a valid 10-digit mobile number.');
    }
    this.value = value.trim();
  }

  equals(other) {
    if (!(other instanceof MobileNumber)) return false;
    return this.value === other.value;
  }
}
