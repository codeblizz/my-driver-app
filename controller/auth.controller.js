const _ = require('lodash');
const jwt = require('jsonwebtoken');
const { env } = require('../config');
const utils = require('../helpers/utils');
const driverService = require('../services/driver.service');
const smsService = require('../services/sms.service');
const client = require('../helpers/redisClient');
const constant = require('../helpers/constant');
const { formatError } = require('../helpers/utils');

module.exports = {
  sendOtp: async (req, res) => {
    try {
      const driver = await driverService.findOne(
        { driverId: req.body.driverId },
        { mobileNumber: 1, isSandBox: 1, _id: 0 }
      );
      if (!driver) return res.status(404).json(utils.formatError(utils.languageMapper(env.driver.driverNotFound, req.language)))
      let otp = await client.get(env.TOPIC_PREFIX + constant.OTP + req.body.driverId);
      if (!otp || env.isDevelopment || req.body.useMasterOTP || driver.isSandBox) {
        otp = (env.isDevelopment || req.body.useMasterOTP || driver.isSandBox) ? 123456 : _.random(99999, 999999);
        await client.set(
          env.TOPIC_PREFIX+ constant.OTP + req.body.driverId,
          otp,
          'ex',
          300
        );
      }
      
      const toSend = _.template(utils.languageMapper(env.otp.sms, req.language))({ otp });
      const isSent = (env.isDevelopment || req.body.useMasterOTP || driver.isSandBox) || await smsService.send(driver.mobileNumber.toString(), toSend);
      if (isSent)
        return res.json({
          message: _.template(utils.languageMapper(env.otp.client, req.language))({
            mobileLast4digit: driver.mobileNumber.toString().slice(-4),
          }),
        });
    } catch (error) {
      return res.status(400).json(utils.formatError(error));
    }
  },
  verifyOtp: async (req, res) => {
    try {
      const driverData = await driverService.findOne(
        { driverId: req.body.driverId },
        { _id: 0, driverId: 1, mobileNumber: 1, name: 1, emailId:1, careemId:1, national:1, location: 1, companyCode: 1}
      );
      let isVerified = await client.get(env.TOPIC_PREFIX + constant.OTP + req.body.driverId) || false;
      isVerified = isVerified == req.body.OTP;
      if (!isVerified) throw {message: utils.languageMapper(env.otp.wrongOtp, req.language)};
 
      const tokenData = { driverId: req.body.driverId, companyCode: driverData.companyCode};
      const toSend = {
        accessToken: jwt.sign(tokenData, env.JWT_SECRET, { expiresIn: '1d' }),
        refreshToken: jwt.sign(tokenData, env.JWT_SECRET, { expiresIn: '14d'})
      }
      Object.assign(toSend, driverData)
      res.json(toSend);   
      client.del(env.TOPIC_PREFIX + constant.OTP + req.body.driverId);
    } catch (error) {
      return res.status(400).json(utils.formatError(error))
    }
  },
  refreshToken: (req, res) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if(!token) return res.status(404).json({message: 'Invalid Token'});
    try {
      const data = jwt.verify(token, env.JWT_SECRET);
      delete data.iat;
      delete data.exp;
      return res.json({token: jwt.sign(data, env.JWT_SECRET, {expiresIn: '1d'})});
    } catch (error) {
      return res.status(405).json(formatError(error))
    }
  }
};
