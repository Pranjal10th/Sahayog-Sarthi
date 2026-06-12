import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    // Agar URI abhi bhi default placeholder hai toh warning dega
    if (process.env.MONGO_URI.includes('xxxx')) {
      console.error('⚠️  Bhai, pehle .env file me apni REAL MongoDB Atlas connection string daalo!');
      return;
    }
    
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`🚀 MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Database Connection Error: ${error.message}`);
    // Development me nodemon ko crash nahi karne denge taaki file change par auto-retry ho sake
  }
};

export default connectDB;