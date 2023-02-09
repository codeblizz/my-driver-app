const driverController = require('../controller/driver.controller');
const useMethodOverride = require('../middlewares/useMethodOverride');
const useBffAuth = require('../middlewares/useBffAuth');
const router = require('express').Router();


router.use(useBffAuth);
// For security purpose, We are using method override to some use case
router.use(useMethodOverride());

router.get('/', driverController.find);
router.get('/:driverId', driverController.findOne);
router.post('/', driverController.create);
router.patch('/:driverId', driverController.patchOne);
router.put('/:driverId', driverController.updateOne);
router.delete('/:driverId', driverController.deleteOne);

module.exports = router;
