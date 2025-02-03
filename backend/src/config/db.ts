import mongoose from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI as string;

if (!MONGO_URI) {
  throw new Error("Missing MONGO_URI in environment variables.");
}

export async function connectDB(): Promise<void> {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
}