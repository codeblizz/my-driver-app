const mongoose = require('mongoose');
const { accidentReportSchema } = require('./accident.schema');
const { driverSchema } = require('./driver.schema');
const { inspectorSchema } = require('./qi/inspector.schema');
const { inspectionSchema } = require('./qi/inspection.schema');
const { recoveryReportSchema } = require('./recovery.schema');
const { resumptionSchema } = require('./resumption.schema');
const { notificationSchema } = require('./notification.schema');
const { leaveSchema } = require('./leave.schema');
const { passportSchema } = require('./passport.schema');
const { documentSchema } = require('./document.schema');
const { vehicleChangeSchema } = require('./vehicleChange.schema');
const { partnerChangeSchema } = require('./partnerChange.schema');
const { maintenanceSchema } = require('./maintenance.schema');
const { dayAllocationSchema } = require('./dayAllocation.schema');
const { lovSchema } = require('./lov.schema');

module.exports = {
  driverModel: mongoose.model('driver', driverSchema),
  accidentReportModel: mongoose.model('accident', accidentReportSchema),
  recoveryReportModel: mongoose.model('recovery', recoveryReportSchema),
  dutyResumptionModel: mongoose.model('duty_resumption', resumptionSchema),
  notificationModel: mongoose.model('notification', notificationSchema),
  leaveModel: mongoose.model('leave', leaveSchema),
  passportModel: mongoose.model('passport', passportSchema),
  documentModel: mongoose.model('document', documentSchema),
  vehicleChangeModel: mongoose.model('vehicleChange', vehicleChangeSchema),
  partnerChangeModel: mongoose.model('partnerChange', partnerChangeSchema),
  configModel: mongoose.model('config', mongoose.Schema({}, { collection: 'config', strict: false })),
  inspectorModel: mongoose.model('inspector', inspectorSchema),
  inspectionModel: mongoose.model('inspection', inspectionSchema),
  maintenanceModel: mongoose.model('maintenance', maintenanceSchema),
  dayAllocationModel : mongoose.model('dayAllocation', dayAllocationSchema),
  lovModel: mongoose.model('lov', lovSchema),
  webHookModel: mongoose.model('webHook', mongoose.Schema({}, { strict: false })),
};
