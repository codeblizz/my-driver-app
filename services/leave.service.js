const axios = require('axios');
const { host, env } = require('../config');
const { formatError } = require('../helpers/utils');
const utils = require('../helpers/utils');
const { leaveModel } = require('../model');
const _ = require('lodash');
const { LEAVETYPE } = require('../helpers/constant');

module.exports = {

  applyLeave: async ({ driverId, companyCode }, payload) => {
    const leaverequest = { driverId, ...payload };
    const leave = await leaveModel.create(leaverequest);
    const { data } = await axios
      .post(
        host.driverHost + '/leaves', { leaverequest },
        utils.mergeHeaderConfig(env.MGW_DRIVER_KEY, { 'company-code': companyCode })
      );
    const toReturn = utils.handleResponse(data);
    leaveModel.updateOne({_id: leave._id}, {$push:{erpRes: toReturn}}).catch(console.error)
    return toReturn;
  },

  availableLeaves: async ({ driverId, companyCode }, absenceCode) => {
    const { data } = await axios.get(
      host.driverHost + '/leaves/balance' + utils.formatQuery({
        driverId,
        absenceCode,
        date: new Date().toISOString().slice(0, 10)
      }), utils.mergeHeaderConfig(env.MGW_DRIVER_KEY, { 'company-code': companyCode })
    );
    return utils.handleResponse(data);
  },

  listLeaves: async ({ driverId, companyCode }, absenceCode, language) => {
    if (!LEAVETYPE.includes(absenceCode)) throw utils.languageMapper(env.hr.leave.notFound, language);
    const { data } = await axios.get(
      host.driverHost + '/leaves/leave-status' + utils.formatQuery({
        driverId,
        absenceCode: absenceCode,
      }), utils.mergeHeaderConfig(env.MGW_DRIVER_KEY, { 'company-code': companyCode })
    );
    return utils.handleResponse(data, 'L');
  },

}