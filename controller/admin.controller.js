const config = require('../config');
module.exports = {
  updateAppConfig: (req, res) =>
  config.env
      .appConfig()
      .then(() => res.json({ message: true }))
      .catch((err) => res.status(400).json(formatError(err))),
  appLink: async (req, res) => {
    if (!['android', 'ios'].includes(req.params.type))
      return res.end(`Type ${req.params.type} is not under consideration`);
    let link = config.env.TOPIC_PREFIX + `_${req.params.type}_link`;
    await client.set(link, req.body.link);
    return res.end('Updated!');
  }
};
