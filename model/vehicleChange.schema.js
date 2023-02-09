const mongoose = require('mongoose');
const utils = require('../helpers/utils');

const vehicleChangeSchemaRule = {
    driverId: {
        type: String,
        required: true,
        index: true
      }, 
      cartaxiNumber: String,
      referenceId: String,
      erpRes: [{type: mongoose.Schema.Types.Mixed}],
      isDeleted: {
        type: Boolean,
        required: true,
        default: false
      }
    };

const vehicleChangeSchema = mongoose.Schema(vehicleChangeSchemaRule, { timestamps: true });
utils.filterUndeletedMongooseHooks(vehicleChangeSchema);

module.exports = {
    vehicleChangeSchemaRule,
    vehicleChangeSchema
};