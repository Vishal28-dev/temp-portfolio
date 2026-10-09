import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from './logger.js';

mongoose.set('strictQuery', true);
mongoose.set('sanitizeFilter', true); // neutralises operator injection in query filters

const STATES = ['disconnected', 'connected', 'connecting', 'disconnecting'];

export const dbState = () => ({
  state: STATES[mongoose.connection.readyState] ?? 'unknown',
  name: mongoose.connection.name ?? null,
});

export async function connectDb({ retries = 10, delayMs = 3000 } = {}) {
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      await mongoose.connect(env.MONGO_URI, {
        serverSelectionTimeoutMS: 5000,
        maxPoolSize: 10,
      });
      logger.info({ db: mongoose.connection.name }, 'mongo connected');
      return mongoose.connection;
    } catch (err) {
      const last = attempt === retries;
      logger.warn(
        { attempt, retries, err: err.message },
        last ? 'mongo connection failed' : 'mongo unavailable, retrying'
      );
      if (last) throw err;
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  return null;
}

export async function disconnectDb() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close(false);
    logger.info('mongo connection closed');
  }
}
