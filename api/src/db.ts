import mongoose from 'mongoose';

export async function connect(uri: string): Promise<void> {
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
}

export async function disconnect(): Promise<void> {
  await mongoose.disconnect();
}
