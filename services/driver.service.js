const { driverModel } = require('../model');
module.exports = {
  find: (filter, projection = {}) =>
    driverModel.find(filter, projection).lean(),
  findOne: (filter, projection = {}) =>
    driverModel.findOne(filter, projection).lean(),
  create: (driverData) => driverModel.create(driverData),
  updateOne: (driverId, driverData) => {
    let filter = { driverId };
    if(driverData.staffId){
      filter = { $or: [filter, {staffId: driverData.staffId}] }
    }
    return driverModel.replaceOne(filter, {driverId, ...driverData}, { runValidators: true, upsert: true });
  },
  patchOne: (driverId, driverData) => driverModel.updateOne({ driverId }, driverData, { runValidators: true, upsert: true }),
  deleteOne: (driverId) => driverModel.updateOne({ driverId }, { $set: { isDeleted: true } }),
};
