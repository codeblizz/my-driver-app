const _ = require('lodash');
const jwt = require('jsonwebtoken');
const { env } = require('../../config');
const utils = require('../../helpers/utils');
const inspectorService = require('../../services/qi/inspector.service');
const smsService = require('../../services/sms.service');
const client = require('../../helpers/redisClient');
const constant = require('../../helpers/constant');

module.exports = {
  sendOtp: async (req, res) => {
    try {
      const inspector = await inspectorService.findOne(
        { inspectorId: req.body.inspectorId },
        { mobileNumber: 1, isSandBox: 1, _id: 0 }
      );
      if (!inspector) return res.status(404).json(utils.formatError(utils.languageMapper(env.inspector.notFound, req.language)))
      let otp = await client.get(env.TOPIC_PREFIX + constant.OTP + req.body.inspectorId);
      if (!otp || env.isDevelopment || req.body.useMasterOTP || inspector.isSandBox) {
        otp = env.isDevelopment || req.body.useMasterOTP || inspector.isSandBox ? 123456 : _.random(99999, 999999);
        await client.set(env.TOPIC_PREFIX + constant.OTP + req.body.inspectorId, otp, 'ex', 300);
      }

      const toSend = _.template(utils.languageMapper(env.otp.sms, req.language))({ otp });
      const isSent = (env.isDevelopment || req.body.useMasterOTP || inspector.isSandBox) || await smsService.send(inspector.mobileNumber.toString(), toSend);
      if (isSent)
        return res.json({
          message: _.template(utils.languageMapper(env.otp.client, req.language))({
            mobileLast4digit: inspector.mobileNumber.toString().slice(-4)
          })
        });
    } catch (error) {
      return res.status(400).json(utils.formatError(error));
    }
  },
  verifyOtp: async (req, res) => {
    try {
      const inspectorData = await inspectorService.findOne(
        { inspectorId: req.body.inspectorId },
        { _id: 0, mobileNumber: 1, name: 1, companyCode: 1 }
      );
      let isVerified =
        (await client.get(env.TOPIC_PREFIX + constant.OTP + req.body.inspectorId)) || false;
      isVerified = isVerified == req.body.OTP;
      if (!isVerified) throw { message: utils.languageMapper(env.otp.wrongOtp, req.language) };

      const tokenData = {
        insPectorId: req.body.inspectorId,
        inspectorId: `${inspectorData.name} (${req.body.inspectorId})`,
        companyCode: inspectorData.companyCode
      };
      const toSend = {
        accessToken: jwt.sign(tokenData, env.JWT_SECRET, { expiresIn: '1d' }),
        refreshToken: jwt.sign(tokenData, env.JWT_SECRET, { expiresIn: '14d' })
      };
      Object.assign(toSend, inspectorData);
      client.del(env.TOPIC_PREFIX + constant.OTP + req.body.inspectorId);
      return res.json(toSend);
    } catch (error) {
      return res.status(400).json(utils.formatError(error));
    }
  },
  refreshToken: (req, res) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if(!token) return res.status(401).json({message: 'Invalid Token'});
    try {
      const data = jwt.verify(token, env.JWT_SECRET);
      delete data.iat;
      delete data.exp;
      return res.json({token: jwt.sign(data, env.JWT_SECRET, {expiresIn: '1d'})});
    } catch (error) {
      return res.status(400).json(utils.formatError(error))
    }
  }
};
