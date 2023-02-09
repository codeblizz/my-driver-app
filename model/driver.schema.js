const mongoose = require('mongoose');
const utils = require('../helpers/utils');
const driverSchemaRule = {
  staffId: {
    type: String,
    required: true,
    unique: true
  },
  driverId: {
    type: String,
    required: true,
    unique: true
  },
  careemId: String,
  name: String,
  hrStatus: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE'],
    default: 'INACTIVE',
    required: true
  },
  rtaPermitNo: String,
  permitIssueDate: String,
  permitExpiryDate: String,
  licenseNo: String,
  licenseIssueDate: String,
  licenseExpiryDate: String,
  licIssuingAuthority: String,
  trafficFileNumber: String,
  shifts: {
    type: String,
    enum: ['12D', '12N', '24HRS']
  },
  mobileNumber: Number,
  dateOfBirth: String,
  national: String,
  location: String,
  emailId: String,
  companyCode: {
    type: String,
    required: true
  },
  isSandBox: {
    type: Boolean,
    required: true,
    default: false
  },
  isDeleted: {
    type: Boolean,
    required: true,
    default: false
  }
};
const driverSchema = mongoose.Schema(driverSchemaRule, { timestamps: true });
utils.filterUndeletedMongooseHooks(driverSchema, [], {
  _conditions: { hrStatus: 'ACTIVE', mobileNumber: { $gt: 0 } }
});

['mobileNumber', 'emailId'].map((e) =>
  driverSchema.index(
    { [e]: 1 },
    { unique: true, partialFilterExpression: { [e]: { $exists: true } } }
  )
);

module.exports = {
  driverSchemaRule,
  driverSchema
};
