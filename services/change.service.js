const axios = require('axios');
const { host, env } = require('../config');
const utils = require('../helpers/utils');
const _ = require('lodash');
const {
  vehicleChangeModel,
  partnerChangeModel,
  dayAllocationModel,
  driverModel
} = require('../model');
const notificationService = require('./notification.service');
const client = require('../helpers/redisClient');
const constant = require('../helpers/constant');
const commService = require('./comm.service');
const commUtils = require('../helpers/commUtils');

module.exports = {
  listModel: async ({ companyCode }) => {
    const { data } = await axios.get(
      host.driverHost + '/vehicle/models',
      utils.mergeHeaderConfig(env.MGW_DRIVER_KEY, { 'company-code': companyCode })
    );
    return utils.handleResponse(data, 'L');
  },

  getAvailableVehicle: async (staffData, model) => {
    const { data } = await axios.get(
      host.driverHost +
        '/vehicles' +
        utils.formatQuery({ driverId: staffData.driverId, make: model }),
      utils.mergeHeaderConfig(env.MGW_DRIVER_KEY, { 'company-code': staffData.companyCode })
    );
    return utils.handleResponse(data, 'L');
  },

  getVehicleView: async (staffData) => {
    const { data } = await axios.get(
      host.driverHost + '/vehicles/view' + utils.formatQuery({ driverId: staffData.driverId }),
      utils.mergeHeaderConfig(env.MGW_DRIVER_KEY, { 'company-code': staffData.companyCode })
    );
    return utils.handleResponse(data, 'L');
  },

  changeVehicle: async ({ driverId, companyCode }, payload) => {
    const changeVehicle = await vehicleChangeModel.create({ ...payload, driverId });
    const { data } = await axios.post(
      host.driverHost + '/vehicles',
      { vehicle: { ...payload, driverId } },
      utils.mergeHeaderConfig(env.MGW_DRIVER_KEY, { 'company-code': companyCode })
    );
    const vehicle = utils.handleResponse(data);
    vehicleChangeModel
      .updateOne(
        { _id: changeVehicle._id },
        {
          $set: { referenceId: vehicle.vehicleChangeRequestId },
          $push: { erpRes: vehicle }
        }
      )
      .catch(console.error);
    return vehicle;
  },

  changePartner: async ({ driverId, companyCode }, payload) => {
    const changePartner = await partnerChangeModel.create({ ...payload, driverId });
    const { data } = await axios.post(
      host.driverHost + '/partners',
      { driver: { ...payload, driverId } },
      utils.mergeHeaderConfig(env.MGW_DRIVER_KEY, { 'company-code': companyCode })
    );
    const partner = utils.handleResponse(data);
    partnerChangeModel
      .updateOne(
        { _id: changePartner._id },
        { $set: { referenceId: partner.requestId }, $push: { erpRes: partner } }
      )
      .catch(console.error);
    return partner;
  },

  getAvailablePartners: async (staffData, query) => {
    const { data } = await axios.get(
      host.driverHost + '/partners' + utils.formatQuery({ driverId: staffData.driverId, ...query }),
      utils.mergeHeaderConfig(env.MGW_DRIVER_KEY, { 'company-code': staffData.companyCode })
    );
    return utils.handleResponse(data, 'L');
  },

  getRequestedPartners: async (staffData) => {
    const { data } = await axios.get(
      host.driverHost + '/partners/view' + utils.formatQuery({ driverId: staffData.driverId }),
      utils.mergeHeaderConfig(env.MGW_DRIVER_KEY, { 'company-code': staffData.companyCode })
    );
    return utils.handleResponse(data, 'L');
  },

  handoverTakeover: async (payload, language) => {
    const driverIds = {};
    for (let i = 0; i < payload.length; i++) {
      const data = payload[i];
      if (!data.carsTaxiNumber || !data.reportingTime) {
        payload.splice(i, 1);
        --i;
        continue;
      }
      driverIds[data.partnerDriverId] = 1;
      for (const driverData of data.drivers) {
        driverIds[driverData.id] = 1;
      }
    }
    if (!payload.length) throw 'Not sent';
    const driverIdList = Object.keys(driverIds);
    const driverFoundAll = await driverModel.aggregate([
      { $match: { driverId: { $in: Object.keys(driverIds) } } },
      { $group: { _id: null, foundIds: { $push: '$driverId' } } },
      { $project: { notFoundIds: { $setDifference: [Object.keys(driverIds), '$foundIds'] } } }
    ]);

    const toReturn = {
      message: 'sent'
    };

    if (driverFoundAll[0]?.notFoundIds.length > 0) {
      (toReturn.message =
        'Not able to send notifications for some drivers as drivers not found in db'),
        (toReturn.notFoundIds = driverFoundAll[0].notFoundIds.map((e) => ({ driverId: e }))),
        (toReturn.useErr = true);
    }
    const toBulkUpdate = payload.map((p) => {
      const drivers = p.drivers;
      return {
        updateOne: {
          filter: { requestId: p.requestId },
          update: {
            $set: _.omit(p, ['drivers', 'requestId']),
            $addToSet: { drivers: { $each: drivers } }
          },
          upsert: true
        }
      };
    });
    await dayAllocationModel.bulkWrite(toBulkUpdate);
    driverData = await driverModel.find(
      { driverId: { $in: driverIdList } },
      { _id: 0, mobileNumber: 1, driverId: 1 }
    );
    const driverDataMap = {};
    driverData.forEach((e) => {
      driverDataMap[e.driverId] = e;
    });

    payload.forEach((e) => {
      if (e.partnerDriverId) {
        const carsTaxiNumber = e.carsTaxiNumber;
        const reportingTime = e.reportingTime;
        const notificationPayload = {
          title: 'Handover Takeover',
          message: _.template(utils.languageMapper(env.change.dAlo.notification.driver, language))({
            carsTaxiNumber,
            reportingTime
          })
        };
        e.drivers.forEach((driver) => {
          if (driverDataMap[driver.id]) {
            notificationPayload.driverId = driver.id;
            notificationService.preparePushNotification(notificationPayload);
          }
        });
      }
    });
    if (toReturn.notFoundIds) throw toReturn;
    return toReturn;
  },

  getTakeOrHandOverId: ({ driverId }, status) => {
    return dayAllocationModel
      .findOne({ acceptedDriverId: driverId, status }, { _id: 1, requestId: 1, carsTaxiNumber: 1 })
      .lean();
  },

  updateTakeOrHandOver: async (
    { driverId, companyCode },
    requestId,
    keyType,
    { images, type, reason }
  ) => {
    await dayAllocationModel.updateOne(
      { requestId },
      { $set: { [keyType]: { images, reason, erpResp: [] }, status: type } }
    );
    let inspectionType = 1;
    if (type === 'TAKEOVER') inspectionType = 2;
    const { data } = await axios.post(
      host.driverHost + '/handover-takeover',
      {
        handoverTakeover: {
          driverId,
          inspectionType,
          leaveId: requestId,
          status: true,
          reason,
          images
        }
      },
      utils.mergeHeaderConfig(env.MGW_DRIVER_KEY, { 'company-code': companyCode })
    );
    const handOverTakeOver = utils.handleResponse(data);
    if (inspectionType === 2) type = 'HANDOVER';
    else type = 'COMPLETE';
    await dayAllocationModel.updateOne(
      { requestId },
      { $push: { [`${keyType}.erpResp`]: handOverTakeOver }, $set: { status: type } }
    );
    // get partner driverId shift and carsTaxiNumber
    return handOverTakeOver;
  },
  getRequestList: async (staffData) => {
    const fromDate = new Date();
    fromDate.setUTCHours(fromDate.getUTCHours() - 20);
    const requestData = await dayAllocationModel.aggregate([
      {
        $match: { status: 'SENT', 'drivers.id': staffData.driverId, createdAt: { $gte: fromDate } }
      },
      {
        $project: {
          carsTaxiNumber: 1,
          reportingTime: 1,
          partnerDriverId: 1,
          requestId: 1,
          updatedAt: 1,
          _id: 0
        }
      },
      {
        $lookup: {
          from: 'drivers',
          let: { driverId: '$partnerDriverId' },
          pipeline: [
            { $match: { $expr: { $eq: ['$$driverId', '$driverId'] } } },
            { $project: { _id: 0, name: 1, mobileNumber: 1 } }
          ],
          as: 'partnerDetail'
        }
      },
      {
        $project: {
          reportingTime: 1,
          carsTaxiNumber: 1,
          requestId: 1,
          updatedAt: 1,
          partnerDetail: { $first: '$partnerDetail' }
        }
      },
      { $sort: { updatedAt: -1 } },
      { $limit: 10 },
      { $skip: 0 }
    ]);
    return requestData;
  },

  acceptRequest: async function ({ driverId, companyCode }, requestId, language) {
    const istakeOver = await client.get(env.TOPIC_PREFIX + constant.HANDOVER_TAKEOVER + requestId);
    const alreadyAccepted = await client.get(
      env.TOPIC_PREFIX + constant.HANDOVER_TAKEOVER + driverId
    );
    if (istakeOver || alreadyAccepted) {
      throw utils.languageMapper(env.change.accept.already, language);
    }
    const isRequest = await dayAllocationModel
      .findOne(
        { requestId, 'drivers.id': driverId },
        { _id: 1, partnerDriverId: 1, reportingTime: 1, carsTaxiNumber: 1 }
      )
      .lean();
    if (!isRequest) throw utils.languageMapper(env.change.accept.notFound, language);
    const payload = { leaveId: requestId, status: true };
    const { data } = await axios.post(
      host.driverHost + '/notifications-acceptance',
      { notifications: { ...payload, driverId } },
      utils.mergeHeaderConfig(env.MGW_DRIVER_KEY, { 'company-code': companyCode })
    );
    const handOverTakeOver = utils.handleResponse(data);
    this.updateAcceptedDriver(requestId, driverId, isRequest, language).catch(console.error);
    return handOverTakeOver;
  },

  updateAcceptedDriver: async function (
    requestId,
    driverId,
    { partnerDriverId, reportingTime, carsTaxiNumber },
    language
  ) {
    await dayAllocationModel.updateOne(
      { requestId },
      { $set: { status: 'TAKEOVER', acceptedDriverId: driverId } }
    );
    await client.set(
      env.TOPIC_PREFIX + constant.HANDOVER_TAKEOVER + requestId,
      'accepted',
      'ex',
      43200
    );
    await client.set(
      env.TOPIC_PREFIX + constant.HANDOVER_TAKEOVER + driverId,
      'accepted',
      'ex',
      43200
    );
    const driverDetails = await driverModel.findOne({ driverId }, { mobileNumber: 1 });
    const mobileNumber = driverDetails.mobileNumber;
    const notificationPayload = {
      driverId: partnerDriverId,
      title: 'Handover Takeover',
      message: _.template(utils.languageMapper(env.change.dAlo.notification.partner, language))({
        mobileNumber,
        carsTaxiNumber,
        reportingTime
      })
    };
    this.mailToBackOfficeForDayAllocation(carsTaxiNumber, partnerDriverId, driverId);
    notificationService.preparePushNotification(notificationPayload);
  },

  mailToBackOfficeForDayAllocation: async (carsTaxiNumber, partnerDriverId, IdleDriverId) => {
    const { shifts, companyCode, staffId, name } = await driverModel.findOne(
      { driverId: partnerDriverId },
      { _id: 0, shifts: 1, companyCode: 1, staffId: 1, name: 1 }
    );
    const emailEnv = env.change.dAlo.notification.backOffice.email;
    const sender = emailEnv.fromEmail;
    const to = emailEnv.profile.location[companyCode];
    const subject = `Allocation for carsTaxiNumber ${carsTaxiNumber} for driver Id ${IdleDriverId}`;
    const body = `Vehicle allocation request received from Staff ID - ${staffId} with Name: ${name} for the Vehicle carsTaxi Number ${carsTaxiNumber} for the ${shifts} shift`;
    return commService.sendNotificationBulk([commUtils.emailTemplate(sender, to, subject, body)]);
  }
};
