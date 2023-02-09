const { env } = require('../config');
const { formatError } = require('../helpers/utils');

module.exports = (req, res, next) => {
    try {
        if (env.BUDDY_BFF_KEY != req.headers['x-api-key']) {
            return res.status(401).json({ message: 'Invalid API key' });
        }
    } catch (error) {
        return res.status(400).json(formatError(error));
    }
    next();
}