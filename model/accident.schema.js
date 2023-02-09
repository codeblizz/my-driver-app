const mongoose = require('mongoose');
const utils = require('../helpers/utils');

const accidentReportSchemaRule = {
  accident: {
    driverId: {
      type: String,
      required: true
    },
    reportingDateTime: {
      type: String,
      required: true
    },
    accidentDateTime: {
      type: String,
      required: true
    },
    location: {
      latitude: {
        type: Number
      },
      longitude: {
        type: Number
      }
    },
    criticality: String,
    recoveryRequired: { type: String, enum: ['Yes', 'No'] },
    vehicleHeldByPolice: { type: String, enum: ['Yes', 'No'] },
    remarks: String
  },
  police: {
    compliantNumber: {
      type: Number,
      required: [function(){return this.accident.vehicleHeldByPolice === 'Yes'}, 'Police Paper is required if vehicle held by police']
    },
    reportStatus: {
      type: String
    },
    stationLocation: {
      type: String,
      required: [function(){return this.accident.vehicleHeldByPolice === 'Yes'}, 'Police Paper is required if vehicle held by police']
    },
    policePaper: String
  },
  isDeleted: {
    type: Boolean,
    required: true,
    default: false
  }
};
const accidentReportSchema = mongoose.Schema(accidentReportSchemaRule);
utils.filterUndeletedMongooseHooks(accidentReportSchema);

module.exports = {
  accidentReportSchemaRule,
  accidentReportSchema
};
