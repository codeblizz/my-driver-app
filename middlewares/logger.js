const { env } = require('../config');
const mongoLogger = require('../helpers/mongoLogger');
const mongoLogUri = env.MONGO_URL;

const mongodbOptions = {
  dbName: 'Log_Buddysapp_' + env.NODE_ENV,
  user: env.MONGO_USER,
  pass: env.MONGO_PASS
};

module.exports = mongoLogger(mongoLogUri, mongodbOptions, 'driver');
