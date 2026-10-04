import type { Express } from 'express';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { connect, disconnect } from '../src/db.js';

export interface TestApp {
  app: Express;
  stop: () => Promise<void>;
  reset: () => Promise<void>;
}

export async function startTestApp(): Promise<TestApp> {
  const mongo = await MongoMemoryServer.create();
  await connect(mongo.getUri());
  const app = createApp();
  return {
    app,
    reset: async () => {
      await mongoose.connection.dropDatabase();
    },
    stop: async () => {
      await disconnect();
      await mongo.stop();
    },
  };
}
