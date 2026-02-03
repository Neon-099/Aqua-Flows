//for starting the database connection and the web server.

import dotenv from 'dotenv';
dotenv.config({ path: '.env.development' });
import mongoose from 'mongoose';
import app from './app.js';

const PORT = process.env.PORT || 5500

const start = async () => {
    //CHECK FOR CRITICAL ENV VARIABLES EARLY
    if(!process.env.JWT_SECRET || !process.env.DATABASE_URI){
        throw new Error('JWT_SECRET and MONGO_URI must be defined');
    }
try {
    await mongoose.connect(process.env.DATABASE_URI);
    console.log('🍃 Connected to MongoDB');

    app.listen(PORT, () => {
      console.log(`🚀 Auth Service listening on port ${PORT}`);
    });
  } catch (err) {
    console.error('Database connection failed:', err);
  }
}

start();