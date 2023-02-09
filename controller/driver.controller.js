const utils = require('../helpers/utils');
const config = require('../config');
const driverService = require('../services/driver.service');

module.exports = {
  find: async (req, res) => {
    try {
      const data = await driverService.find(req.query.filter, req.query.projection);
      return res.json(data)
    } catch (error) {
      return res.status(400).json(utils.formatError(error));
    }

  },
  findOne: async (req, res) => {
    try {
      const data = await driverService.findOne({ driverId: req.params.driverId }, req.query.projection);
      if(!data) throw utils.formatError(utils.languageMapper(config.env.driver.driverNotFound, req.language));
      return res.json(data)
    } catch (error) {
      return res.status(400).json(utils.formatError(error));
    }
  },
  create: async (req, res) => {
    try {
      const driverResult = await driverService.create(req.body);
      return res.status(201).json(driverResult);
    } catch (error) {
      return res.status(400).json(utils.formatError(error));
    }
  },

  updateOne: async (req, res) => {
    try {
      const driver = await driverService.updateOne(req.params.driverId, req.body);
      return res.status(202).json(driver);
    } catch (error) {
      return res.status(400).json(utils.formatError(error));
    }
  },
  patchOne: async(req, res)=>{
    try {
      const driver = await driverService.patchOne(
        req.params.driverId,
        req.body
      );
      return res.status(202).json(driver);
    } catch (error) {
      return res.status(400).json(utils.formatError(error));
    }
  },
  deleteOne: async (req, res) => {
    try {
      const delDriver = await driverService.deleteOne(req.params.driverId);
      return res.json(delDriver);
    } catch (error) {
      return res.status(400).json(utils.formatError(error));
    }
  },
};
