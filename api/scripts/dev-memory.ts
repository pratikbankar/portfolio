// Local development without installing MongoDB: starts an in-memory database,
// seeds the resume content and runs the API. Data is lost when the process stops.
import { MongoMemoryServer } from 'mongodb-memory-server';

const defaults: Record<string, string> = {
  NODE_ENV: 'development',
  PORT: '4000',
  JWT_SECRET: 'local-development-secret-not-for-production',
  WEB_ORIGIN: 'http://localhost:3000',
  REVALIDATE_SECRET: 'local-revalidate-secret',
  ADMIN_EMAIL: 'admin@example.com',
  ADMIN_PASSWORD: 'local-admin-password',
};
for (const [key, value] of Object.entries(defaults)) process.env[key] ??= value;

const mongo = await MongoMemoryServer.create();
process.env.MONGODB_URI = mongo.getUri('portfolio');

const { config } = await import('../src/config.js');
const { connect } = await import('../src/db.js');
const { seed } = await import('../src/seed/run.js');
const { createApp } = await import('../src/app.js');

await connect(config.MONGODB_URI);
await seed();
createApp().listen(config.PORT, () => {
  console.log(`API (in-memory database) on http://localhost:${config.PORT}`);
  console.log(`Admin login: ${config.ADMIN_EMAIL} / ${config.ADMIN_PASSWORD}`);
});
