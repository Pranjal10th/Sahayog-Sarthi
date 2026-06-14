warning: in the working copy of 'backend/scratch/adminOverviewVerification.js', LF will be replaced by CRLF the next time Git touches it
[1mdiff --git a/backend/scratch/adminOverviewVerification.js b/backend/scratch/adminOverviewVerification.js[m
[1mindex 1a92bad..4b54e87 100644[m
[1m--- a/backend/scratch/adminOverviewVerification.js[m
[1m+++ b/backend/scratch/adminOverviewVerification.js[m
[36m@@ -4,9 +4,32 @@[m [mimport User from '../src/models/User.js';[m
 import Worker from '../src/models/Worker.js';[m
 import Booking from '../src/models/Booking.js';[m
 import Payment from '../src/models/Payment.js';[m
[31m-import { getAdminOverviewHub } from '../src/controllers/workerController.js';[m
[32m+[m[32m// import { getAdminOverviewHub } from '../src/controllers/workerController.js';[m
 import { getAdminOverviewUseCase } from '../src/modules/worker/infrastructure/di/container.js';[m
 [m
[32m+[m[32m// Local implementation of legacy getAdminOverviewHub to avoid importing deleted files[m
[32m+[m[32mconst getAdminOverviewHubLocal = async () => {[m
[32m+[m[32m  const totalUsers = await User.countDocuments();[m
[32m+[m[32m  const activeWorkers = await Worker.countDocuments({ kycStatus: 'approved', isAvailable: true });[m
[32m+[m[32m  const paymentsPaid = await Payment.find({ status: 'paid' });[m
[32m+[m[32m  const platformRevenue = paymentsPaid.reduce((sum, current) => sum + (current.amount * 0.15), 0);[m
[32m+[m[32m  const pendingWorkers = await Worker.find({ kycStatus: 'pending' });[m
[32m+[m[32m  const liveBookings = await Booking.find({[m[41m [m
[32m+[m[32m    status: { $in: ['pending', 'accepted', 'in_progress'] }[m[41m [m
[32m+[m[32m  }).sort({ createdAt: -1 });[m
[32m+[m
[32m+[m[32m  return {[m
[32m+[m[32m    success: true,[m
[32m+[m[32m    metrics: {[m
[32m+[m[32m      totalUsers,[m
[32m+[m[32m      activeWorkers,[m
[32m+[m[32m      platformRevenue: parseFloat(platformRevenue.toFixed(2))[m
[32m+[m[32m    },[m
[32m+[m[32m    pendingWorkers,[m
[32m+[m[32m    liveBookings[m
[32m+[m[32m  };[m
[32m+[m[32m};[m
[32m+[m
 dotenv.config();[m
 [m
 async function run() {[m
[36m@@ -103,18 +126,8 @@[m [masync function run() {[m
 [m
     console.log('Test records seeded successfully.');[m
 [m
[31m-    // 1. Execute legacy controller with response mock[m
[31m-    let legacyData = null;[m
[31m-    const mockRes = {[m
[31m-      status(code) {[m
[31m-        return {[m
[31m-          json(data) {[m
[31m-            legacyData = data;[m
[31m-          }[m
[31m-        };[m
[31m-      }[m
[31m-    };[m
[31m-    await getAdminOverviewHub({}, mockRes);[m
[32m+[m[32m    // 1. Execute legacy controller local mock[m
[32m+[m[32m    const legacyData = await getAdminOverviewHubLocal();[m
 [m
     // 2. Execute clean usecase[m
     const cleanOutput = await getAdminOverviewUseCase.execute();[m
