const router = require('express').Router();
const useInspectionAuth = require('../../middlewares/useInspectionAuth');
const lovController = require('../../controller/lov.controller');


router.all('/app-link/:type', async (req, res) => {
    if (!['GET', 'PUT'].includes(req.method)) return res.end('Method is not under consideration');
    if (!['android', 'ios'].includes(req.params.type))
      return res.end(`Type ${req.params.type} is not under consideration`);
      let link = config.env.TOPIC_PREFIX + `_qi_${req.params.type}_link`;
    if (req.method === 'GET') {
      link = await client.get(link);
      if(!link) return res.end(`No latest build link for ${req.params.type}`);
      return res.redirect(link);
    } else if (req.method === 'PUT' && req.body.link) {
      await client.set(link, req.body.link);
      return res.end('Updated!')
    }else return res.end('Try Again!');
  });

router.use(useInspectionAuth);

router.use('/auth', require('./auth'));
router.get('/lov', lovController.getLov);
router.use('/inspection', require('./inspection'));

module.exports = router;