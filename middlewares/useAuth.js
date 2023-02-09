const jwt = require('jsonwebtoken');
const { env } = require('../config');
const utils = require('../helpers/utils');
const client = require('../helpers/redisClient');

module.exports = async (req, res, next) => {
  req.language = req.headers['accept-language']?.toUpperCase().slice(0, 2) || 'EN';
  const authIgnored = ['/driver', '/qi', '/admin'].find((e) => req.path.startsWith(e));
  if (authIgnored) return next();
  try {
    const token = req.headers['authorization'].split(' ')[1];
    const tokenData = jwt.verify(token, env.JWT_SECRET);
    const isBlacklisted = await client.get(env.TOPIC_PREFIX + '_DRIVER_BLACKLIST_' + tokenData.driverId);
    if(isBlacklisted) throw 'This driver id is blacklisted';
    req.staffData = tokenData;
    return next();
  } catch (error) {
    return res.status(401).json({ message: utils.languageMapper(env.auth.invalid, req.language) });
  }
};
