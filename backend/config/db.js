import mongoose from 'mongoose';
import { resolveMongoConnectionString } from './mongoUri.js';

const connectDB = async () => {
  const uri = resolveMongoConnectionString();
  mongoose.set('strictQuery', true);
  try {
    await mongoose.connect(uri);
  } catch (err) {
    const code = err?.code ?? err?.codeName;
    const msg = err?.message ?? String(err);
    if (code === 8000 || /bad auth|Authentication failed/i.test(msg)) {
      console.error(
        "[MongoDB] Authentication failed. In Atlas: Database Access → verify user/password, then update backend/config/appEnv.local.ts.\n" +
          "If the password contains @ # : / or spaces, use MONGODB_ATLAS_USER, MONGODB_ATLAS_PASSWORD, MONGODB_ATLAS_CLUSTER (and MONGODB_ATLAS_DB) instead of a single MONGODB_URL string.",
      );
    }
    throw err;
  }
  console.log('MongoDB connected:', uri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'));
};

export default connectDB;
