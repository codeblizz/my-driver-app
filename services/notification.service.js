const { notificationModel, driverModel } = require('../model');
const client = require('../helpers/redisClient');
const useFCMAdmin = require('../helpers/useFcmAdmin');
const config = require('../config');
const constant = require('../helpers/constant');
const mongoose = require('mongoose');
const commUtils = require('../helpers/commUtils');
const commService = require('./comm.service');
const enableWebPush = false;

//   useFCMAdmin
//   .messaging()
//   .subscribeToTopic(['<device_token>'], 'test_token')
//   .then((response) => {
//     console.log('Successfully subscribed to topic:', response);
//     return true;
//   })

module.exports = {
  getNotification: (filter, projection, options) => {
    const toReturn = notificationModel.find(filter, projection, options).lean();
    notificationModel.updateMany(filter, { $set: { isRead: true } }).catch(console.error);
    return toReturn;
  },

  toAll: async function (payload) {
    let skip = 0;
    const count = await driverModel.count({});
    for (let i = 0; i <= count; i = i + 29) {
      let drivers = await driverModel.find({}, { driverId: 1, _id: 0 }).skip(skip).limit(30).lean();
      skip += drivers.length;
      drivers = drivers.map((driver) => {
        const _id = new mongoose.Types.ObjectId();
        return {
          _id,
          driverId: driver.driverId,
          type: [{ communication: 'APPNOTIFICATION' }],
          title: payload.title,
          data: {notiId: _id.toString()},
          message: payload.message,
  
        }
      });
      await notificationModel.insertMany(drivers);
      for (const driver of drivers) {
        this.pushNotification(driver);
      }
    }
    return {message: 'Sent to All', count: skip}
  },

  preparePushNotification: async function (payload) {
    if (!payload.type) {
      payload.type = [{ communication: 'APPNOTIFICATION' }];
    }
    const notification = await notificationModel.create(payload);
    if (!payload.data) payload.data = {};
    payload.data.notiId = notification.id;
    return this.pushNotification(payload);
  },

  pushNotification: async (payload) => {
    const notiKey = config.env.TOPIC_PREFIX + constant.NOTIFICATION + payload.driverId;
    let count = await client.get(notiKey);
    client.set(notiKey, ++count);
    const pushData = {
      topic: config.env.TOPIC_PREFIX + payload.driverId.toString(),
      data: payload.data,
      notification: { title: payload.title, body: payload.message }
    };

    if (enableWebPush) {
      pushData.webPush = {
        fcm_options: {
          link: 'http://localhost:8081'
        }
      };
    }
    const fcmRef = await useFCMAdmin
      .messaging()
      .send(pushData)
      .catch((err) => err.message);
    return {
      updateOne: {
        find: {
          _id: mongoose.Types.ObjectId(payload.data.notiId),
          'type.communication': 'APPNOTIFICATION'
        },
        update: { $set: { 'type.$.communication.ref': fcmRef } }
      }
    };
  },

  sendWhatsappNotificationBulk: async function (batchData, driverMobileMap) {
    batchData = batchData.map((e) =>
      commUtils.whatsappTemplate(`+${driverMobileMap[e.driverId].mobileNumber}`, e.message)
    );
    return commService.sendNotificationBulk(batchData);
  }
};
