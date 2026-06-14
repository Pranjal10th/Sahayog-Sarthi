# Sahayog Sarthi – Phase 1 Completion Walkthrough

This document outlines the completion of Phase 0 and Phase 1, covering initial environment verification, missing REST API endpoints, database schema fixes, and frontend page alignment.

## 1. Files Created & Modified

### Created Files
- [backend/data/policies.json](file:///c:/Users/bibha/Desktop/sahayog-sarthi/backend/data/policies.json): Static JSON file containing cancellation, refund, safety, and code of conduct policies.
- [backend/data/services.json](file:///c:/Users/bibha/Desktop/sahayog-sarthi/backend/data/services.json): Static JSON file describing available categories (Electrician, Plumber, Carpenter, Cleaner, Painter) and their scope of work.
- [backend/data/pricing.json](file:///c:/Users/bibha/Desktop/sahayog-sarthi/backend/data/pricing.json): Static JSON file outlining base rates, hourly pricing structures, platforms fees, and night/emergency surge rules.
- [backend/tests/paymentRedirect.test.js](file:///c:/Users/bibha/Desktop/sahayog-sarthi/backend/tests/paymentRedirect.test.js): Integration test suite verifying Razorpay order generation, signature verification, Sarthi wallet settlement, KYC admin operations, and withdrawals using real JWT signatures.

### Modified Files
- [backend/src/models/Payment.js](file:///c:/Users/bibha/Desktop/sahayog-sarthi/backend/src/models/Payment.js): Completely replaced duplicate Express router configurations with the standard Mongoose schema supporting both payments and withdrawals.
- [backend/src/controllers/paymentController.js](file:///c:/Users/bibha/Desktop/sahayog-sarthi/backend/src/controllers/paymentController.js): Integrated Payment schema logging into `createPaymentOrder` and `verifyPaymentSignature` endpoints, and implemented `requestWalletWithdrawal` payout logic.
- [backend/src/controllers/workerController.js](file:///c:/Users/bibha/Desktop/sahayog-sarthi/backend/src/controllers/workerController.js): Implemented explicit individual functions for approving (`approveWorkerKYC`), rejecting (`rejectWorkerKYC`), blocking (`blockWorkerAccount`), and unblocking (`unblockWorkerAccount`) workers.
- [backend/src/routes/worker.js](file:///c:/Users/bibha/Desktop/sahayog-sarthi/backend/src/routes/worker.js): Registered explicit KYC routes and the `/admin/overview` metric aggregation endpoint in the correct priority order.
- [backend/src/controllers/bookingController.js](file:///c:/Users/bibha/Desktop/sahayog-sarthi/backend/src/controllers/bookingController.js): Implemented missing methods `getBookingById`, `getBookingHistory`, `cancelBooking`, and `startBooking`.
- [backend/src/routes/booking.js](file:///c:/Users/bibha/Desktop/sahayog-sarthi/backend/src/routes/booking.js): Registered all missing endpoints and connected them to the authentication middleware.
- [backend/src/routes/payment.js](file:///c:/Users/bibha/Desktop/sahayog-sarthi/backend/src/routes/payment.js): Registered the `/withdraw` endpoint.
- [backend/package.json](file:///c:/Users/bibha/Desktop/sahayog-sarthi/backend/package.json): Integrated the `test:phase1` script.
- [frontend/src/pages/payment/[bookingId].js](file:///c:/Users/bibha/Desktop/sahayog-sarthi/frontend/src/pages/payment/%5BbookingId%5D.js): Modified URL success query arguments to align with landing page expectations (`payment_success=true&booking_id=${bookingId}`).
- [frontend/src/pages/admin/index.js](file:///c:/Users/bibha/Desktop/sahayog-sarthi/frontend/src/pages/admin/index.js): Replaced fallback sandbox mock states with live API console triggers, and integrated descriptive error handling alerts.

---

## 2. API Endpoint Inventory Registered

All endpoints are prefix-nested under `/api/v1`.

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| **POST** | `/payments/create-order` | Generates Razorpay checkout order and writes pending Payment logs | Yes |
| **POST** | `/payments/verify` | Validates Razorpay checkout signature and top-up Sarthi wallet | Yes |
| **POST** | `/payments/withdraw` | Processes worker payouts, deducts wallet, writes audit log | Yes |
| **GET** | `/workers/admin/overview` | Aggregates system metrics (users, active workers, platform commission) | Yes |
| **PUT** | `/workers/:id/approve` | Verifies worker KYC status and toggles availability online | Yes |
| **PUT** | `/workers/:id/reject` | Rejects worker KYC application and sets availability offline | Yes |
| **PUT** | `/workers/:id/block` | Toggles worker account block flag (`isBlocked: true`) | Yes |
| **PUT** | `/workers/:id/unblock` | Restores worker blocked status (`isBlocked: false`) | Yes |
| **GET** | `/bookings/history` | Retrieves paginated booking history lists filtered by User role | Yes |
| **GET** | `/bookings/chats/:id` | Returns chat logs for the booking session | Yes |
| **GET** | `/bookings/:id` | Syncs state parameters of specific booking console node | Yes |
| **PUT** | `/bookings/:id/cancel` | Allows cancelling unhandled booking request (removes timeouts) | Yes |
| **PUT** | `/bookings/:id/start` | Advances accepted booking into `in_progress` state | Yes |

---

## 3. Database Schema Modifications

The **`Payment`** schema in `backend/src/models/Payment.js` has been redefined to hold the following parameters:

```javascript
{
  bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: false, index: true },
  customerId: { type: Schema.Types.ObjectId, ref: 'User', required: false },
  workerId: { type: Schema.Types.ObjectId, ref: 'Worker', required: true, index: true },
  razorpayOrderId: { type: String, required: false },
  razorpayPaymentId: { type: String },
  amount: { type: Number, required: true },
  platformFee: { type: Number, required: true, default: 0 },
  workerAmount: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['created', 'paid', 'failed', 'refunded', 'withdrawal_pending', 'withdrawal_completed'], 
    default: 'created', 
    index: true 
  },
  paymentMethod: { type: String },
  transactionType: { type: String, enum: ['payment', 'withdrawal'], default: 'payment' },
  transactionDate: { type: Date, default: Date.now }
}
```

*Changes from initial draft:* Made `bookingId`, `customerId`, and `razorpayOrderId` optional to seamlessly support worker payout/withdrawal entries which only involve the worker's ledger, and added `transactionType` to distinguish core payment items from withdrawals.

---

## 4. Test Suite Execution & Validation Reports

A dedicated integration suite `backend/tests/paymentRedirect.test.js` was run and resulted in a **100% Success Rate**:

```bash
PASS tests/paymentRedirect.test.js
  Sahayog Sarthi Phase 1 Integration Tests
    √ POST /api/v1/payments/create-order should generate Order and Payment schema document log (107 ms)
    √ POST /api/v1/payments/verify should process Sandbox verification & top-up Sarthi wallet balance (108 ms)
    √ PUT /api/v1/workers/:id/approve and reject/block should work correctly (346 ms)
    √ POST /api/v1/payments/withdraw should process worker withdrawals (70 ms)

Test Suites: 1 passed, 1 total
Tests:       4 passed, 4 total
Snapshots:   0 total
Time:        3.858 s
```
