// backend/src/modules/booking/domain/entities/Booking.js
// Pure domain entity — no Mongoose or infrastructure dependencies

export default class BookingEntity {
  constructor({
    id,
    customerId,
    workerId,
    serviceType,
    status,
    scheduledAt,
    completedAt,
    amount,
    paymentStatus,
    customerAddress,
    notes,
    metadata,
    createdAt,
    updatedAt,
  }) {
    this.id = id;
    this.customerId = customerId;
    this.workerId = workerId;
    this.serviceType = serviceType;
    this.status = status ?? 'pending';
    this.scheduledAt = scheduledAt;
    this.completedAt = completedAt;
    this.amount = amount;
    this.paymentStatus = paymentStatus ?? 'pending';
    this.customerAddress = customerAddress;
    this.notes = notes;
    this.metadata = metadata ?? {};
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  // ---------- State Machine Helpers ----------

  canAccept() {
    return this.status === 'pending';
  }

  canStart() {
    return this.status === 'accepted';
  }

  canComplete() {
    return this.status === 'in_progress';
  }

  canCancel() {
    return this.status === 'pending' || this.status === 'accepted';
  }

  cancellationIncursFee() {
    return this.status === 'accepted';
  }

  isCompletedForPayment() {
    return this.status === 'completed';
  }
}
