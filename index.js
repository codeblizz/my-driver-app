require('dotenv').config();
const env = require('./config/env');
const redisClient = require('./helpers/redisClient');
const useDb = require('./helpers/useDb');
const logger = require('./middlewares/logger');

async function main() {
  await redisClient.ping();
  console.log('redis connected');
  const db = await useDb;
  console.log('mongodb connected');
  await env.appConfig();
  await logger.connect(db);
  console.log('Mongo Logger Connected');
  logger.axiosLogger('ext', 172800);
  console.log('axios logger used');
  const app = require('./app');
  app.listen(3001);
  return true; 
}

main()
  .then(() => console.log('Server is running at http://localhost:3001'))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
