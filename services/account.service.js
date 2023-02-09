const axios = require('axios');
const { host, env } = require('../config');
const utils = require('../helpers/utils');

module.exports = {
  accountType: {
    COLLECTION: host.driverHost + '/collections',
    OUTSTANDING: host.driverHost + '/outstandings',    
  },
  getCollection: async function (date, staffData) {
    const uri = this.accountType.COLLECTION + utils.formatQuery({ driverId: staffData.driverId, collectionDate: date })
    const { data } = await axios.get(
      uri,
      utils.mergeHeaderConfig(env.MGW_DRIVER_KEY, { 'company-code': staffData.companyCode })
    );
    return utils.handleResponse(data)
  },
  getOutstanding: async function (staffData) {
    const { data } =  await axios.get(
      this.accountType.OUTSTANDING + utils.formatQuery({driverId: staffData.driverId}),
      utils.mergeHeaderConfig(env.MGW_DRIVER_KEY, { 'company-code': staffData.companyCode })
    );
    const toReturn = utils.handleResponse(data, 'L');
    if(data.total){
      toReturn.push({outstandingType: 'Total', amount: data.total})
    }
    return toReturn
  },
};
