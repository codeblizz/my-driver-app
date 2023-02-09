const Redis = require('ioredis');
const { env } = require('../config');
const config = { host: env.REDIS_HOST, port: env.REDIS_PORT };
if(env.REDIS_PASSWORD) config.password = env.REDIS_PASSWORD;
const redisClient = new Redis({
  ...config,
  retryStrategy(times) {
    if (times === parseInt(env.MAX_REDIS_RETRY)) {
      return false;
    }
    return Math.min(times * 50, 2000);
  },
  reconnectOnError(err) {
    const targetError = 'READONLY';
    if (err.message.includes(targetError)) {
      // Only reconnect when the error contains "READONLY"
      return true; // or `return 1;`
    }
  }
});

module.exports = redisClient;
