const jwt = require('jsonwebtoken');
const { env } = require('../config');
const utils = require('../helpers/utils');

module.exports = (req, res, next) => {
  req.language = req.headers['accept-language']?.toUpperCase().slice(0, 2) || 'EN';
  const authIgnored = ['/auth'].find((e) => req.path.startsWith(e));
  if (authIgnored) return next();
  try {
    const token = req.headers['authorization'].split(' ')[1];
    req.inspector = jwt.verify(token, env.JWT_SECRET);
    return next();
  } catch (error) {
    return res.status(401).json({ message: utils.languageMapper(env.auth.invalid, req.language) });
  }
};
