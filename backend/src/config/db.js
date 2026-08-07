const mongoose = require('mongoose');

mongoose.set('bufferCommands', false);

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri || uri.includes('<username>') || uri.includes('******') || uri.includes('placeholder')) {
    console.warn('[MongoDB] MONGODB_URI not configured or placeholder detected. Skipping DB connection as requested.');
    return;
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log(`[MongoDB] Connected: ${conn.connection.host}`);

    mongoose.connection.on('disconnected', () => {
      console.warn('[MongoDB] Disconnected. Attempting reconnect...');
    });
    mongoose.connection.on('error', (err) => {
      console.error(`[MongoDB] Error: ${err.message}`);
    });
  } catch (err) {
    console.error(`[MongoDB] Connection failed: ${err.message}`);
    // Continue without exiting; app will work in degraded mode for local development
  }
};

module.exports = connectDB;
