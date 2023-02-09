const router = require('express').Router();
const { moveFile } = require('../helpers/aws');
const { formatError } = require('../helpers/utils');

router.get('/', async (req, res)=>{
    try {
        const location = req.query.location;
        await moveFile(location);
        res.json({location: location.replace('temp', 'buddy')})
    } catch (error) {
        if(error.statusCode == 404) return res.status(error.statusCode).json(error);
        return res.status(400).json(formatError(error))
    }

});

module.exports = router;
