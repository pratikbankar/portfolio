import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    fileParallelism: false,
    testTimeout: 30000,
    hookTimeout: 120000,
    env: {
      NODE_ENV: 'test',
      MONGODB_URI: 'mongodb://127.0.0.1:27017/unused',
      JWT_SECRET: 'test-secret-test-secret-test-secret',
      WEB_ORIGIN: 'http://localhost:3000',
      REVALIDATE_SECRET: 'test-revalidate-secret',
      ADMIN_EMAIL: 'admin@example.com',
      ADMIN_PASSWORD: 'correct-horse-battery',
    },
  },
});
