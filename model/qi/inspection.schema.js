const mongoose = require('mongoose');
const utils = require('../../helpers/utils');

const inspectionSchemaRule = {
  type: {
    type: String
  },
  inspectorId: {
    type: String,
    required: true
  },
  data: mongoose.Schema.Types.Mixed,
  referenceId: String,
  erpRes:[{type: mongoose.Schema.Types.Mixed}],
  isDeleted: {
    type: Boolean,
    required: true,
    default: false
  }
};

const inspectionSchema = mongoose.Schema(inspectionSchemaRule);
utils.filterUndeletedMongooseHooks(inspectionSchema);

module.exports = {
  inspectionSchemaRule,
  inspectionSchema
};
