const { env } = require('./env');

module.exports = {
  selfHost: env.SELF_HOST,
  driverHost: env.MGW_HOST + '/automotive/driver/v1/drivers',
  smsHost: env.MGW_HOST + '/common/communication/v1/sms',
  bookingSlotHost: env.MICRO_HOST + '/common/appointment/v1/calender',
  vehicleHost: env.MGW_HOST + '/automotive/vehicle/v1/vehicles',
  inspectionHost: env.MGW_HOST + '/automotive/vehicle/v1/quality-check/inspection',
  commAuthHost: env.COMM_AUTH_HOST,
  commHost: env.COMM_HOST
};
