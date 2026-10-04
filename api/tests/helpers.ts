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

export const ADMIN = { email: 'admin@example.com', password: 'correct-horse-battery' };

/** Creates the admin account and returns an agent that carries its session cookie. */
export async function loginAgent(app: Express) {
  const { createAdminUser } = await import('../src/models/AdminUser.js');
  await createAdminUser(ADMIN.email, ADMIN.password);
  const supertest = (await import('supertest')).default;
  const agent = supertest.agent(app);
  const res = await agent.post('/api/auth/login').send(ADMIN);
  if (res.status !== 200) throw new Error(`test login failed: ${res.status}`);
  return agent;
}
