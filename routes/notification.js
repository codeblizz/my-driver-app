const router = require('express').Router();
const notificationController = require('../controller/notification.controller');

router.get('/', notificationController.getNotification);
router.get('/count', notificationController.getNotificationCount);

module.exports = router;