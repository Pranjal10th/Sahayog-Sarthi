import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Booking from './src/models/Booking.js';

dotenv.config();

const ALLOWED_STATUSES = ['pending', 'accepted', 'in_progress', 'completed', 'paid', 'cancelled'];

async function run() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017';
    console.log('Connecting to database:', mongoUri);
    await mongoose.connect(mongoUri);
    
    // 1. Total booking count
    const totalCount = await Booking.countDocuments();
    
    // 2. Count by booking status
    const statusCounts = await Booking.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    // 3. Any invalid statuses found
    const invalidStatusDocs = await Booking.find({
      status: { $nin: ALLOWED_STATUSES }
    });
    
    // 4. Any documents missing status
    const missingStatusCount = await Booking.countDocuments({
      status: { $exists: false }
    });

    console.log('\n================ DATABASE INSPECTION RESULTS ================');
    console.log(`1. Total booking count: ${totalCount}`);
    
    console.log('\n2. Count by booking status:');
    if (statusCounts.length === 0) {
      console.log('   No bookings found in database.');
    } else {
      statusCounts.forEach(group => {
        console.log(`   - ${group._id || '[No Status Field]'}: ${group.count}`);
      });
    }
    
    console.log(`\n3. Invalid statuses found: ${invalidStatusDocs.length}`);
    if (invalidStatusDocs.length > 0) {
      invalidStatusDocs.forEach(doc => {
        console.log(`   - Booking ID: ${doc._id}, Status: "${doc.status}"`);
      });
    }
    
    console.log(`\n4. Documents missing status: ${missingStatusCount}`);
    
    // 5. Whether migration or status backfill is required
    const migrationRequired = (invalidStatusDocs.length > 0 || missingStatusCount > 0);
    console.log(`\n5. Migration or status backfill required: ${migrationRequired ? 'YES' : 'NO'}`);
    console.log('=============================================================\n');
    
    await mongoose.connection.close();
  } catch (err) {
    console.error('Error running script:', err);
  }
}

run();
