const leaveController = require('../controller/leave.controller');

const router = require('express').Router();

router.post('/', leaveController.applyLeave);
router.get('/:type', leaveController.listLeaves);


module.exports = router;