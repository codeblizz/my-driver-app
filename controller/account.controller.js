const config = require('../config');
const utils = require('../helpers/utils');
const accountService = require('../services/account.service');
const driverService = require('../services/driver.service');

module.exports = {
  collection: async (req, res) => {
    try {
      const collectionDate = req.query.collectionDate;
      const regex = /^\d{2}-\d{2}-\d{4}$/;
      if (!collectionDate.match(regex))
        return utils.formatError({ message: utils.languageMapper(config.env.accounts.invalidDate, req.language) });
      const collectionDetails = await accountService.getCollection(
        collectionDate,
        req.staffData
      );
      return res.json(collectionDetails);
    } catch (error) {
      return res.status(400).json(utils.formatError(error));
    }
  },
  outstanding: async (req, res) => {
    try {
      const outstandingDetails = await accountService.getOutstanding(req.staffData);
      return res.json(outstandingDetails);
    } catch (error) {
      return res.status(400).json(utils.formatError(error));
    }
  },
  profile: async (req, res) => {
    try {
      req.query.projection = JSON.parse(req.query.projection || '{}');
      const driver = await driverService.findOne(req.staffData, req.query.projection);
      return res.json(driver)
    } catch (error) {
      return res.status(400).json(utils.formatError(err))
    }
  }
};
