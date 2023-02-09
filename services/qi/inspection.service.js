const inspectionUtils = require('../../helpers/inspectionUtils');
const { configModel, inspectionModel, maintenanceModel } = require('../../model');
const { host, env } = require('../../config');
const utils = require('../../helpers/utils');
const axios = require('axios');

module.exports = {
  getInspectionList: async function ({ companyCode }, query) {
    query.$select =
      'dataAreaId, InspectionId, InspectionType, InspectionStatus, ModifiedDateTime1, VehicleChassisNum, CTNum';
    query.$orderby = 'ModifiedDateTime1 desc';
    query.$filter = `CTNum ne '' and dataAreaId eq '${companyCode}' and InspectionStatus eq Microsoft.Dynamics.DataEntities.AGIDrivingLicenseStatus'InProgress'`;
    if (query.carsTaxiNumber) {
      query.$filter += `and CTNum eq '${query.carsTaxiNumber}'`;
      delete query.carsTaxiNumber;
    }

    if (query.$pageRef) {
      query.$filter += 'and ModifiedDateTime1 lte ' + query.$pageRef;
      delete query.$pageRef;
    }

    const { data } = await axios.post(
      host.inspectionHost + 's',
      { url: encodeURI(utils.formatQuery(query).slice(1)) },
      utils.mergeHeaderConfig(env.MGW_VEHICLE_KEY, {
        'company-code': companyCode
      })
    );
    return utils.handleResponse(data, 'L');
  },
  // getInspectionTypes: configModel
  //   .findOne({ name: 'inspection' }, { 'type.value': 1, 'type.label': 1, _id: 0 })
  //   .lean()
  //   .then((data) => data.type),
  getInspectionTypeFields: (type) =>
    configModel
      .findOne({ name: 'inspection' }, { type: { $elemMatch: { key: type } }, _id: 0 })
      .lean()
      .then((e) => e.type[0]),

  createInspection: async (inspectorData, payload) => {
    payload.inspectedBy = inspectorData.inspectorId;
    const inspection = await inspectionModel.create({
      data: payload,
      inspectorId: inspectorData.inspectorId
    });
    const { data } = await axios.post(
      host.inspectionHost,
      { inspection: payload },
      utils.mergeHeaderConfig(env.MGW_VEHICLE_KEY, { 'company-code': inspectorData.companyCode })
    );
    const toReturn = utils.handleResponse(data);
    inspectionModel
      .updateOne(
        { _id: inspection._id },
        { $set: { referenceId: toReturn.reference }, $push: { erpRes: toReturn } }
      )
      .catch(console.error);
    return toReturn;
  },
  createMaintenence: async (
    inspectorData,
    { driverId = null, notes = null, maintenanceRequestType = 'Inspection', carsTaxiNumber }
  ) => {
    const maintenance = {
      driverId,
      notes,
      maintenanceRequestType,
      carsTaxiNumber,
      category: 'Inspection'
    };
    const { data } = await axios.post(
      host.vehicleHost + '/ondemand/maintenance',
      { maintenance },
      utils.mergeHeaderConfig(env.MGW_VEHICLE_KEY, { 'company-code': inspectorData.companyCode })
    );
    const toReturn = utils.handleResponse(data);
    maintenance.referenceId = toReturn.referenceId;
    maintenance.erpRes = [toReturn];
    maintenanceModel.create(maintenance).catch(console.error);
    return toReturn;
  },

  updateInspection: async (inspectorData, requestId, payload) => {
    payload.inspectedBy = inspectorData.inspectorId;
    await inspectionModel.updateOne(
      {
        referenceId: requestId,
        inspectorId: inspectorData.inspectorId
      },
      { $set: { data: payload } },
      { upsert: true }
    );
    const { data } = await axios.put(
      host.inspectionHost + '/' + requestId,
      { inspection: payload },
      utils.mergeHeaderConfig(env.MGW_VEHICLE_KEY, { 'company-code': inspectorData.companyCode })
    );
    const toReturn = utils.handleResponse(data);
    inspectionModel
      .updateOne(
        { referenceId: requestId, inspectorId: inspectorData.inspectorId },
        { $push: { erpRes: toReturn } }
      )
      .catch(console.error);
    return toReturn;
  },

  getInspectionDrivers: async (inspectorData, carsTaxiNumber) => {
    const { data } = await axios.get(
      host.driverHost + '/handover-takeover' + utils.formatQuery({ carsTaxiNumber }),
      utils.mergeHeaderConfig(env.MGW_DRIVER_KEY, { 'company-code': inspectorData.companyCode })
    );
    return utils.handleResponse(data, 'L');
  }
};
