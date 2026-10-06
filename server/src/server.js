const path = require('path');

// Load server/.env before anything reads process.env.
require('dotenv').config({ path: path.join(__dirname, '..', '.env'), quiet: true });

const REQUIRED_ENV = ['MONGODB_URI', 'JWT_SECRET'];
const missing = REQUIRED_ENV.filter((name) => !process.env[name]);
if (missing.length) {
  console.error(`Missing required environment variables: ${missing.join(', ')} (see server/.env.example)`);
  process.exit(1);
}

const app = require('./app');
const connectDB = require('./config/db');

const PORT = Number(process.env.PORT) || 5000;

async function start() {
  try {
    await connectDB();
  } catch (err) {
    console.error(`Could not connect to MongoDB: ${err.message}`);
    process.exit(1);
  }

  const server = app.listen(PORT, () => {
    console.log(`SmileCare API running on http://localhost:${PORT} (${process.env.NODE_ENV || 'development'})`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') console.error(`Port ${PORT} is already in use`);
    else console.error(err);
    process.exit(1);
  });

  // Fail fast on programming errors that escaped every handler.
  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled promise rejection:', reason);
    server.close(() => process.exit(1));
  });
}

start();
