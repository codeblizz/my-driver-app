const router = require('express').Router();
const inspectionController = require('../../controller/qi/inspection.controller');

router.get('/', inspectionController.getInspectionList);
router.post('/', inspectionController.createInspection);
router.put('/:requestId', inspectionController.updateInspection);

// router.get('/types', inspectionController.getInspectionTypes);
router.get('/fields/:type', inspectionController.getInspectionTypeFields);
router.get('/drivers/:ctNumber', inspectionController.getInspectionDrivers);

module.exports = router;