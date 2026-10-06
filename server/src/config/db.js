const mongoose = require('mongoose');

/**
 * Connects to MongoDB using the MONGODB_URI environment variable.
 * The URI itself is never logged because it contains credentials.
 */
async function connectDB() {
  mongoose.set('strictQuery', true);

  const conn = await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
  });

  console.log(`MongoDB connected (database: ${conn.connection.name})`);
  return conn;
}

module.exports = connectDB;
