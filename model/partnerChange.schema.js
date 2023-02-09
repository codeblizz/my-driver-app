const mongoose = require('mongoose');
const utils = require('../helpers/utils');

const partnerChangeSchemaRule = {
  driverId: {
    type: String,
    required: true,
    index: true
  },
  partnerDriverId: {
    type: String,
    required: true,
    index: true
  },
  referenceId: String,
  erpRes:[{type: mongoose.Schema.Types.Mixed}],
  isDeleted: {
    type: Boolean,
    required: true,
    default: false
  }
};

const partnerChangeSchema = mongoose.Schema(partnerChangeSchemaRule, { timestamps: true });
utils.filterUndeletedMongooseHooks(partnerChangeSchema);

module.exports = {
  partnerChangeSchemaRule,
  partnerChangeSchema
};