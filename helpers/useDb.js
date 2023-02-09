const mongoose = require('mongoose');
const { env } = require('../config');

const db = mongoose.connection;
const mongodbOptions = {
  user: env.MONGO_USER,
  pass: env.MONGO_PASS,
  dbName: env.MONGO_DBNAME
};

function connect() {
  console.log('mongo connecting...');

  mongoose
    .connect(env.MONGO_URL, mongodbOptions)
    .catch((err) =>
      console.error('Mongo error.....', err.toString(), err.code)
    );
}

if (!db.readyState) connect();

let retry = env.MAX_MONGO_RETRY;

module.exports = new Promise((resolve, reject) => {
  //for successful connection
  db.once('open', () => resolve(db));
  //for error in connection
  db.on('error', (err) => {
    if (!['ECONNREFUSED'].includes(err.code)) retry = 0;
    else {
      retry = --retry;
      setTimeout(connect, 3000);
    }
    if (!retry) return reject(err.toString());
  });
});
