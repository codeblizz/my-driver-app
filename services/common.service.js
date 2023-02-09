const axios = require('axios');
const { host, env } = require('../config');
const utils = require('../helpers/utils');

module.exports = {
  driverCommonList: async (staffData, category, filter) => {
    const query = {
      driverId: staffData.driverId,
      requestType: category || 'Token'
    };

    if(filter.driverId) delete filter.driverId;

    Object.assign(query, filter);
    const { data } = await axios.get(
      host.driverHost +
        '/common-requests' +
        utils.formatQuery(query),
      utils.mergeHeaderConfig(env.MGW_DRIVER_KEY, {
        'company-code': staffData.companyCode
      })
    );
    return utils.handleResponse(data, 'L').map(utils.removeEmptyDateFromObject);
  },
};
