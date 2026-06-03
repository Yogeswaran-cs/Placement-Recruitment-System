const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    console.log('Connecting to Atlas MongoDB...');
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000
    });
    console.log(`MongoDB Connected (Atlas): ${conn.connection.host}`);
  } catch (error) {
    console.warn(`Atlas Database connection failed: ${error.message}`);
    
    // In production, do not fall back to in-memory server
    if (process.env.NODE_ENV === 'production') {
      console.error('Production database connection failed. Exiting...');
      process.exit(1);
    }
    
    console.log('Starting local In-Memory MongoDB Server...');
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongoServer = await MongoMemoryServer.create({
        binary: {
          version: '6.0.14'
        }
      });
      const mongoUri = mongoServer.getUri();
      const conn = await mongoose.connect(mongoUri);
      console.log(`MongoDB Connected (In-Memory): ${conn.connection.host}`);
      global.__MONGO_SERVER__ = mongoServer;
    } catch (localError) {
      console.error(`Failed to start In-Memory DB: ${localError.message}`);
      process.exit(1);
    }
  }
};

module.exports = connectDB;
