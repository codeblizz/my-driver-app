const mongoose = require('mongoose');
const utils = require('../../helpers/utils');

const inspectorSchemaRule = {
  inspectorId: {
    type: Number,
    unique: true,
    required: true,
    index: true
  },
  name: String,
  mobileNumber: {
    type: String,
    required: true,
    unique: true
  },
  companyCode:{
    type: String,
    required: true
  },
  isSandBox: {
    type: Boolean,
    required: true,
    default: true
  },
  isDeleted: {
    type: Boolean,
    required: true,
    default: false
  }
};
const inspectorSchema = mongoose.Schema(inspectorSchemaRule);
utils.filterUndeletedMongooseHooks(inspectorSchema);

module.exports = {
  inspectorSchemaRule,
  inspectorSchema
};
