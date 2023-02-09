const session = require('express-session');
const RedisStore = require('connect-redis')(session);
const client = require('../helpers/redisClient');
const config = require('../config');

const sessionInit = session({
  store: new RedisStore({ client, prefix: config.env.TOPIC_PREFIX }),
  secret: config.env.SESSION_SECRET,
  saveUninitialized: true,
  resave: false,
  maxAge: 1 * 24 * 60 * 60 * 1000, // 1 day
  // cookie: { secure: !config.env.isDevelopment }
});

module.exports = (req, res, next) => {
  let tries = 3;
  function lookupSession(error) {
    if (error) {
      return next(error);
    }

    tries--;

    if (req.session !== undefined) {
      return next();
    }

    if (tries < 0) {
      return res.redirect(`/buddy-oauth/sso/msal/login?redirectTo=${req.originalUrl}`)
    }

    sessionInit(req, res, lookupSession);
  }
  lookupSession();
};
