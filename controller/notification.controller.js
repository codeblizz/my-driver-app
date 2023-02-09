const notificationService = require('../services/notification.service');
const { notificationModel, driverModel } = require('../model');
const client = require('../helpers/redisClient');
const utils = require('../helpers/utils');
const { env } = require('../config');
const constant = require('../helpers/constant');
const mongoose = require('mongoose');

module.exports = {
  getNotification: async function (req, res) {
    const projection = { title: 1, message: 1, _id: 0, isRead: 1 };
    const options = { sort: { updatedAt: -1 }, limit: 30 };
    try {
      await client.del(env.TOPIC_PREFIX + constant.NOTIFICATION + req.staffData.driverId);
      const data = await notificationService.getNotification(req.staffData, projection, options);
      return res.json(data);
    } catch (error) {
      return res.status(400).json(utils.formatError(error));
    }
  },
  pushNotification: async (req, res) => {
    try {
      if(req.body.driverId === '*') return res.json(await notificationService.toAll(req.body));
      await notificationService.preparePushNotification(req.body);
      return res.status(201).json({message: 'sent'});
    } catch (error) {
      return res.status(400).json(utils.formatError(error));
    }
  },

  sendBulkNotifications: async (req, res) => {
    res.json({ message: 'Notifications set to queue' });
    const BulkAppNotification = [];
    const BulkWatsapp = [];
    const driverMobileMap = {};
    for (const payload of req.body) {
      payload._id = new mongoose.Types.ObjectId();
      if(!payload.data) payload.data = {};
      payload.data.notiId = payload._id.toString();
      for (const { communication } of payload.type) {
        switch (communication) {
          case 'APPNOTIFICATION':
            BulkAppNotification.push(payload);
            break;

          case 'WA':
            driverMobileMap[payload.driverId] = 1;
            BulkWatsapp.push({driverId: payload.driverId, message: payload.message});
            break;
        }
      }
    }
    await notificationModel.insertMany(req.body);
    Promise.all(BulkAppNotification.map(notificationService.pushNotification));
    const driversData = await driverModel.find({driverId:{$in: Object.keys(driverMobileMap)}}, {_id: 0, driverId: 1, mobileNumber: 1});
    for (const driverData of driversData) {
      driverMobileMap[driverData.driverId] = driverData
    }
    notificationService.sendWhatsappNotificationBulk(BulkWatsapp, driverMobileMap);
    return true;
  },
  getNotificationCount: (req, res) =>
    client
      .get(env.TOPIC_PREFIX + constant.NOTIFICATION + req.staffData.driverId)
      .then((count) => res.json({ count }))
      .catch((err) => res.status(400).json(utils.formatError(err)))
};
