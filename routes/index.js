const router = require('express').Router();
const useAuth = require('../middlewares/useAuth');
const { uploadFile, moveFile } = require('../helpers/aws');
const { formatError } = require('../helpers/utils');
const auth = require('./auth');
const accounts = require('./accounts');
const driver = require('./driver');
const accident = require('./accident');
const operations = require('./operations');
const inspection = require('./qi');
const slot = require('./slot');
const department = require('./department');
const hr = require('./hr');
const admin = require('./admin');
const change = require('./change');
const notification = require('./notification');
const lovController = require('../controller/lov.controller');
const client = require('../helpers/redisClient');
const config = require('../config');
const report = require('./report');
const apiRateLimiter = require('../middlewares/apiRateLimiter');

router.get('/app-link/:type', async (req, res) => {
  if (!['android', 'ios'].includes(req.params.type))
    return res.end(`Type ${req.params.type} is not under consideration`);
    let link = config.env.TOPIC_PREFIX + `_${req.params.type}_link`;
    link = await client.get(link);
    if(!link) return res.end(`No latest build link for ${req.params.type}`);
    return res.redirect(link);
})

router.use('/auth', auth);
router.use(useAuth);
router.use(apiRateLimiter.driverApp);

router.post('/uploadFile', async (req, res) => {
  try {
    return res.status(201).json({ location: await uploadFile(req.files.file) });
  } catch (error) {
    return res.status(400).json(formatError(error));
  }
});

router.post('/moveFile', (req, res) => {
  moveFile(req.body.location).then(link => res.send(link)).catch(console.error)
});

router.get('/lov', lovController.getLov)
router.use('/driver', driver);
router.use('/admin', admin);

router.use('/accounts', accounts);
router.use('/accident', accident);
router.use('/operations', operations);
router.use('/qi', inspection);
router.use('/slot', slot);
router.use('/department', department);
router.use('/hr', hr);
router.use('/notification', notification);
router.use('/change', change);
router.use('/report', report);

module.exports = router;
