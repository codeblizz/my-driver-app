const hrService = require('../services/hr.service');
const utils = require('../helpers/utils');
const _ = require('lodash');

module.exports = {
  createDutyResumption: async (req, res) => {
    try {
      const data = await hrService.createDutyResumption(req.staffData, req.body);
      return res.status(201).json(data);
    } catch (error) {
      return res.status(400).json(utils.formatError(error));
    }
  },
  createPassport: async (req, res) => {
    try {
      const data = await hrService.createPassport(req.staffData, req.body);
      return res.status(201).json(data);
    } catch (error) {
      return res.status(400).json(utils.formatError(error));
    }
  },
  createDocument: async (req, res) => {
    try {
      const data = await hrService.createDocument(req.staffData, req.body);
      return res.status(201).json(data);
    } catch (error) {
      return res.status(400).json(utils.formatError(error));
    }
  },

  getPaySlip: async (req, res) => {
    try {
      if(req.query.projection) req.query.projection = JSON.parse(req.query.projection); 
      let data = await hrService.getPaySlip(req.staffData, req.query);
      if(req.query.projection){
        data = _.pick(data, req.query.projection)
      }
      return res.json(data);
    } catch (error) {
      return res.status(400).json(utils.formatError(error));
    }
  }
};
