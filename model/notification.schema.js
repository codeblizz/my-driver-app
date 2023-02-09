const mongoose = require('mongoose');
const utils = require('../helpers/utils');

const notificationSchemaRule = {
  driverId: {
    type: String,
    required: true,
    index: true
  },
  title: String,
  message: String,
  data: { type: mongoose.Schema.Types.Mixed },
  type: [
    {
      _id: false,
      communication: {
        type: String,
        enum: ['APPNOTIFICATION', 'WA', 'SMS', 'EMAIL'],
        default: 'APPNOTIFICATION',
        required: true
      },
      ref: String
    }
  ],
  isRead: {
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
const notificationSchema = mongoose.Schema(notificationSchemaRule, { timestamps: true });
utils.filterUndeletedMongooseHooks(notificationSchema);

module.exports = {
  notificationSchemaRule,
  notificationSchema
};
