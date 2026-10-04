import { createApp } from './app.js';
import { config } from './config.js';
import { connect } from './db.js';

async function main() {
  await connect(config.MONGODB_URI);
  createApp().listen(config.PORT, () => {
    console.log(`API listening on port ${config.PORT}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
