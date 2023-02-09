const accountController = require('../controller/account.controller');
const authController = require('../controller/auth.controller');

const router = require('express').Router(); 

router.get('/collection', accountController.collection);
router.get('/outstanding', accountController.outstanding);
router.get('/profile', accountController.profile);

module.exports = router; 