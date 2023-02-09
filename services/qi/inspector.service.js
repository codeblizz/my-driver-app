const { inspectorModel } = require('../../model');

module.exports = {
  find: (filter, projection = {}) => inspectorModel.find(filter, projection).lean(),
  findOne: (filter, projection = {}) => inspectorModel.findOne(filter, projection).lean(),
  create: (driverData) => inspectorModel.create(driverData)
};
