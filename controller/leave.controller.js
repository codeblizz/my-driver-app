
const utils = require("../helpers/utils");
const leaveService = require('../services/leave.service');
const operationService = require("../services/operation.service");

module.exports = {

  applyLeave: async (req, res) => {
    try {
      if(req.body.leaveType === 'LL'){
        const shiftStatus = await operationService.getShiftCloser(req.staffData);
        if(shiftStatus === 'open') throw 'You are not allowed to apply for local leave while your shify is open';
      }
      const leaveRes = await leaveService.applyLeave(req.staffData, req.body);
      return res.status(201).json(leaveRes);
    } catch (error) {
      return res.status(400).json(utils.formatError(error));
    }
  },


  listLeaves: async (req, res) => {
    try {
      if (req.params.type === 'available') {
        const list = await leaveService.availableLeaves(req.staffData, req.query.absenceCode || 'AL');
        return res.json(list);
      }
      const list = await leaveService.listLeaves(req.staffData, req.params.type, req.language);
      return res.json(list);
    } catch (error) {
      return res.status(400).json(utils.formatError(error));
    }
  }


}