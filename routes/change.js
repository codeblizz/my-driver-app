const router = require('express').Router();
const changeController = require('../controller/change.controller');
const dayAllocation = require('./dayAllocation');

router.get('/vehicle/available/:model?', changeController.getAvailableVehicle);
router.post('/vehicle', changeController.changeVehicle);
router.get('/vehicle/view', changeController.getVehicleView);

router.get('/partner/:type', changeController.getPartnerList);
router.post('/partner', changeController.changePartner);

//Day Allocation
router.use('/dayAllocation', dayAllocation)

module.exports = router;
