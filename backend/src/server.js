require('dotenv').config();

if (process.env.USE_MOCK_DB === 'true') {
  const mockMongoose = require('./utils/mongooseMock');
  const Module = require('module');
  const originalRequire = Module.prototype.require;
  Module.prototype.require = function (path) {
    if (path === 'mongoose') {
      return mockMongoose;
    }
    return originalRequire.apply(this, arguments);
  };
}

const app = require('./app');
const connectDB = require('./utils/db');

const PORT = process.env.PORT || 5000;

// Connect to database then listen
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});
