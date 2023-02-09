const commUtils = require('../helpers/commUtils');
const { isValidMobileNumber } = require('../helpers/utils');
const utils = require('../helpers/utils');
const commService = require('../services/comm.service');

module.exports = {
  sendBulk: async (req, res) => {
    const { message, type } = req.body;
    const file = req.files.file;
    if (!type.length)
      return res.json({ message: 'You need to pass at least one communication type' });
    if (file.mimetype === 'text/csv') {
      try {
        let mobileNumbers = file.data.toString().trim().split('\r\n');
        mobileNumbers = [...new Set(mobileNumbers)].filter(isValidMobileNumber);
        const totalMobileNumber = mobileNumbers.length;
        if(!totalMobileNumber) res.status(400).json({message: 'Not found any valid mobile number to send Message'});
        let batchData = [];
        if(!req.body.type) req.body.type = 'SMS';
        if(typeof req.body.type == 'string') req.body.type = [req.body.type];
        for (const mode of req.body.type) {
          switch (mode) {
            case 'SMS':
              batchData = batchData.concat(commUtils.smsTemplate(mobileNumbers, message))
              break;
            case 'WA':
              batchData = batchData.concat(mobileNumbers.map(mobileNumber => commUtils.whatsappTemplate(mobileNumber, message)))
              break;
          }
        }
        await commService.sendNotificationBulk(batchData, req.session.msal?.account?.username);
        return res.json({message: 'SENT', totalMobileNumber});
      } catch (error) {
        return res.status(400).json(utils.formatError(error));
      }
    } else return { message: 'File type must be a CSV file' };
  }
};
