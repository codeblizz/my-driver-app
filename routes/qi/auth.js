const router = require('express').Router();
const authInspectionController = require('../../controller/qi/authInspection.controller');

router.post('/send-otp', authInspectionController.sendOtp);
router.post('/verify-otp', authInspectionController.verifyOtp);
router.get('/refresh-token', authInspectionController.refreshToken)


module.exports = router;
