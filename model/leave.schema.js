const { default: mongoose } = require("mongoose");
const constant = require('../helpers/constant');
const utils = require("../helpers/utils");

const leaveSchemaRule = {
    driverId: {
        type: String,
        required: true,
        index: true
    },
    referenceId: String,
    startDate: {
        type: String,
        required: true
    },
    endDate: {
        type: String,
        required: true
    },
    leaveType: {
        type: String,
        enum: constant.LEAVETYPE,
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Accepted', 'Rejected']
    },
    erpRes:[{type: mongoose.Schema.Types.Mixed}],
    isDeleted: {
        type: Boolean,
        required: true,
        default: false
      }
};

const leaveSchema = mongoose.Schema(leaveSchemaRule, { timestamps: true })
utils.filterUndeletedMongooseHooks(leaveSchema);

module.exports = {
    leaveSchemaRule,
    leaveSchema
}