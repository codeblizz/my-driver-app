const { MongoClient } = require('mongodb');
const expressWinston = require('express-winston');
const winston = require('winston');
const _ = require('lodash');
const axios = require('axios');
const util = require('util');
const helpers = require('../node_modules/winston-mongodb/lib/helpers');
const WinstonMongodb = require('winston-mongodb').MongoDB;

function computeDepth(path){
  const startIndex = path.indexOf('/');
  const queryIndex = path.indexOf('?');
  const endsIndex = queryIndex !== -1 ? queryIndex : path.length;
  const depth = path.slice(startIndex, endsIndex).split('/').filter(String);
  return depth.join('_')
}

WinstonMongodb.prototype.log = function (info, cb) {
  if (!this.logDb) {
    this._opQueue.push({ method: 'log', args: arguments });
    return true;
  }
  if (!cb) {
    cb = () => {};
  }
  // Avoid reentrancy that can be not assumed by database code.
  // If database logs, better not to call database itself in the same call.
  process.nextTick(() => {
    if (this.silent) {
      cb(null, true);
    }
    const decolorizeRegex = new RegExp(/\u001b\[[0-9]{1,2}m/g);
    let entry = {
      timestamp: new Date(),
      utcDate: new Date(new Date().setUTCHours(0, 0, 0, 0)),
      level: this.decolorize ? info.level.replace(decolorizeRegex, '') : info.level
    };
    let message = util.format(info.message, ...(info.splat || []));
    entry.message = this.decolorize ? message.replace(decolorizeRegex, '') : message;
    entry.depth = computeDepth(entry.message);
    entry.meta = helpers.prepareMetaData(info[this.metaKey]);
    if (this.storeHost) {
      entry.hostname = this.hostname;
    }
    if (this.label) {
      entry.label = this.label;
    }
    this.logDb
      .collection(this.collection)
      .insertOne(entry)
      .then(() => {
        this.emit('logged');
        cb(null, true);
      })
      .catch((err) => {
        this.emit('error', err);
        cb(err);
      });
  });
  return true;
};

module.exports = function (db, option, label) {
  return {
    connect: async (clientDB) => {
      if (clientDB) {
        if (clientDB.useDb) db = clientDB.useDb(option.dbName);
        else if (clientDB.db) db = clientDB.db(option.dbName);
        else throw 'clientDB is not recognized';
        return true;
      }
      if (typeof db === 'string') {
        const parseUri = new URL(db);
        if (option.user) parseUri.username = option.user;
        if (option.pass) parseUri.password = option.pass;
        parseUri.pathname = option.dbName;
        db = parseUri.href;
        const client = new MongoClient(parseUri.href, {
          useUnifiedTopology: true
        });
        await client.connect();
        db = client.db(parseUri.pathname.slice(1));
        return true;
      }
      throw 'not connected';
    },
    mongoTransport: (collection, expireAfterSeconds = 0) => {
      return new winston.transports.MongoDB({
        db,
        label,
        collection,
        metaKey: 'meta',
        handleExceptions: true,
        expireAfterSeconds
      });
    },
    routerLogger: function (requestWhitelist, expireAfterSeconds = 41472000) {
      return expressWinston.logger({
        transports: [this.mongoTransport('route', expireAfterSeconds)],
        format: winston.format.json(),
        statusLevels: true,
        msg: '{{req.method}} {{req.url}}',
        requestWhitelist: [...requestWhitelist, 'url', 'headers', 'method', 'body', 'query'],
        responseWhitelist: ['_headers', 'statusCode', 'body', 'responseTime'],
        headerBlacklist: [
          'connection',
          'user-agent',
          'postman-token',
          'accept-encoding',
          'content-length',
          'host',
          'x-request-id',
          'x-forwarded-for',
          'x-forwarded-host',
          'x-forwarded-port',
          'x-forwarded-proto',
          'x-forwarded-scheme',
          'x-scheme',
          'if-none-match'
        ]
      });
    },
    errorLogger: function () {
      return expressWinston.errorLogger({
        transports: [this.mongoTransport('error')],
        format: winston.format.json(),
        dumpExceptions: true,
        showStack: true
      });
    },
    customEvent: function (eventName, data, level = 'info') {
      const logger = winston.createLogger({
        transports: [this.mongoTransport('customEvents')],
        format: winston.format.json()
      });
      return logger.log(level, eventName, { meta: data });
    },
    axiosLogger: async function (
      collectionName = 'out',
      expireAfterSeconds = 41472000,
      deleteFromReq,
      deleteHeadersKeys
    ) {
      if (!deleteFromReq) {
        deleteFromReq = [
          'transitional',
          'transformRequest',
          'transformResponse',
          'xsrfCookieName',
          'xsrfHeaderName',
          'env',
          'maxContentLength',
          'maxBodyLength',
          'time'
        ];
      }

      if (!deleteHeadersKeys) {
        deleteHeadersKeys = ['common', 'get', 'put', 'post', 'delete', 'head', 'patch'];
      }
      const axiosLog = await db
        .createCollection(collectionName)
        .then(async (col) => {
          await col.createIndex({ 'time.startTime': 1 }, { background: true, expireAfterSeconds });
          return col;
        })
        .catch(async (err) => {
          if (err.code !== 48) throw err;
          const ttlIndexName = 'time.startTime_1';
          const col = db.collection(collectionName);
          const prevTtlInfo = (await col.indexes()).find((e) => e.name === ttlIndexName);
          if (!prevTtlInfo || prevTtlInfo.expireAfterSeconds != expireAfterSeconds) {
            prevTtlInfo && (await col.dropIndex(ttlIndexName));
            await col.createIndex(
              { 'time.startTime': 1 },
              { background: true, expireAfterSeconds }
            );
          }
          return col;
        });
      axios.interceptors.request.use(
        async function (req) {
          req.time = { startTime: new Date(), utcDate: new Date(new Date().setUTCHours(0, 0, 0, 0)) };
          const saveReq = _.omit(req, deleteFromReq);
          saveReq.headers = _.omit(req.headers, deleteHeadersKeys);

          const inserted = await axiosLog.insertOne({ req: saveReq, time: req.time, label });
          if (inserted.acknowledged) {
            req.logId = inserted.insertedId;
          }
          return req;
        },
        (err) => {
          return Promise.reject(err);
        }
      );

      function saveResponse(res) {
        const endTime = new Date();
        if (res.config.logId) {
          const toUpdate = {
            status: res.status,
            statusText: res.statusText,
            data: res.data,
            headers: res.headers
          };
          axiosLog
            .updateOne(
              { _id: res.config.logId },
              {
                $set: {
                  res: toUpdate,
                  'time.endTime': endTime,
                  'time.duration': endTime - res.config.time.startTime
                }
              }
            )
            .catch(console.error);
        }
      }

      axios.interceptors.response.use(
        async function (res) {
          saveResponse(res);
          return res;
        },
        (err) => {
          saveResponse({ config: err.config, ...err.response });
          return Promise.reject(err);
        }
      );
    }
  };
};
