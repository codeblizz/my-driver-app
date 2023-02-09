
const router = require('express').Router();
const hrController = require('../controller/hr.controller');
const leave = require('./leave');

router.use('/leave', leave);

router.post('/duty-resumption', hrController.createDutyResumption); //Deprecated
router.post('/passport-request', hrController.createPassport);
router.post('/document-request', hrController.createDocument);
router.get('/pay-slip', hrController.getPaySlip);


module.exports = router;