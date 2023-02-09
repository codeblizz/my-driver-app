const router = require('express').Router();
const changeController = require('../controller/change.controller');
const notificationController = require('../controller/notification.controller');
const lovController = require('../controller/lov.controller');
const communicationController = require('../controller/communication.controller');
const cache = require('./cache');
const adminController = require('../controller/admin.controller');

router.use('/cache', cache);
router.put('/config', adminController.updateAppConfig);
router.put('/app-link/:type', adminController.appLink);
router.post('/notification', notificationController.pushNotification);
router.post('/notifications', notificationController.sendBulkNotifications);
router.post('/handOverTakeOver', changeController.handOverTakeOver);
router.post('/lov/:category', lovController.updateLov);
router.post('/communication', communicationController.sendBulk)

module.exports = router;
