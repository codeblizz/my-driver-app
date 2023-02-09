const axios = require('axios');
const { host, env } = require('../config');
const utils = require('../helpers/utils');
const { dutyResumptionModel, passportModel, documentModel } = require('../model');

module.exports = {
  createDutyResumption: async ({ driverId, companyCode }, payload) => {
    const resumption = await dutyResumptionModel.create({ ...payload, driverId });
    const { data } = await axios.post(
      host.driverHost + '/duty-resumption',
      { dutyResumption: { ...payload, driverId } },
      utils.mergeHeaderConfig(env.MGW_DRIVER_KEY, { 'company-code': companyCode })
    );
    dutyResumptionModel
      .updateOne({ _id: resumption._id }, { $set: { referenceId: data.referenceId } })
      .catch(console.error);
    return utils.handleResponse(data);
  },
  createPassport: async ({ driverId, companyCode }, payload) => {
    const document = await passportModel.create({ ...payload, driverId });
    const { data } = await axios.post(
      host.driverHost + '/passport-request',
      { passport: { ...payload, driverId } },
      utils.mergeHeaderConfig(env.MGW_DRIVER_KEY, { 'company-code': companyCode })
    );
    const toReturn = utils.handleResponse(data);
    passportModel.updateOne(
      { _id: document._id },
      { $set: { referenceId: toReturn.referenceId }, $push: { erpRes: toReturn } }
    ).catch(console.error);
    return toReturn;
  },

  createDocument: async ({ driverId, companyCode }, payload) => {
    const document = await documentModel.create({ ...payload, driverId });
    const { data } = await axios.post(
      host.driverHost + '/documents',
      { documents: { ...payload, driverId } },
      utils.mergeHeaderConfig(env.MGW_DRIVER_KEY, { 'company-code': companyCode })
    );
    const toReturn = utils.handleResponse(data);
    documentModel.updateOne(
      { _id: document._id },
      { $set: { RequestDocumentId: toReturn.RequestDocumentId }, $push: { erpRes: toReturn } }
    ).catch(console.error);
    return toReturn;
  },

  getPaySlip: async (staffData, query) => {
    const {fromDate, lastDate: toDate} = utils.firstDateAndLastDate(query.year, query.month);
    const { data } = await axios.get(
      host.driverHost + '/payslip' + utils.formatQuery({ driverId: staffData.driverId, fromDate, toDate }),
      utils.mergeHeaderConfig(env.MGW_DRIVER_KEY, { 'company-code': staffData.companyCode })
    );
    const toReturn =  utils.handleResponse(data);
    if(toReturn.message) throw toReturn.message;
    return toReturn
  }
};
