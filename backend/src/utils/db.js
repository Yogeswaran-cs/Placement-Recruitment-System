const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const connectDB = async () => {
  try {
    console.log('Connecting to Atlas MongoDB...');
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000
    });
    console.log(`MongoDB Connected (Atlas): ${conn.connection.host}`);
  } catch (error) {
    console.warn(`Atlas Database connection failed: ${error.message}`);
    console.log('Starting local In-Memory MongoDB Server...');
    try {
      const mongoServer = await MongoMemoryServer.create({
        binary: {
          version: '4.0.25'
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
