const utils = require('../helpers/utils');
const commonService = require('../services/common.service');

module.exports = {
  driverCommonList: async (req, res) => {
    try {
      const list = await commonService.driverCommonList(req.staffData, req.path.slice(1), req.query);
      return res.json(list);
    } catch (error) {
      return res.status(400).json(utils.formatError(error));
    }
  }
};
