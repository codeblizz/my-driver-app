const utils = require('../helpers/utils');
const changeService = require('../services/change.service');
const _ = require('lodash');
const { moveFile } = require('../helpers/aws');
const { env } = require('../config');

module.exports = {
  changeVehicle: async (req, res) => {
    try {
      const data = await changeService.changeVehicle(req.staffData, req.body);
      return res.status(201).json(data);
    } catch (error) {
      return res.status(400).json(utils.formatError(error));
    }
  },

  getAvailableVehicle: async (req, res) => {
    try {
      const data = await changeService.getAvailableVehicle(
        req.staffData,
        req.params.model || 'ALL'
      );
      return res.json(data);
    } catch (error) {
      return res.status(400).json(utils.formatError(error));
    }
  },

  getVehicleView: async (req, res) => {
    try {
      const data = await changeService.getVehicleView(req.staffData);
      return res.json(data);
    } catch (error) {
      return res.status(400).json(utils.formatError(error));
    }
  },

  getPartnerList: async (req, res) => {
    try {
      if (req.params.type && !['available', 'requested'].includes(req.params.type)) {
        return res.status(404).json({ message: 'Request Type Not Found' });
      }
      if (req.params.type === 'available') {
        const data = await changeService.getAvailablePartners(req.staffData, {
          location: 'All',
          make: 'All',
          'shift-type': 'All',
          $top: 10,
          $skip: 0,
          ...req.query
        });
        return res.json(data);
      } else if (req.params.type === 'requested') {
        const data = await changeService.getRequestedPartners(req.staffData);
        return res.json(data);
      }
    } catch (error) {
      return res.status(400).json(utils.formatError(error));
    }
  },

  changePartner: async (req, res) => {
    try {
      const data = await changeService.changePartner(req.staffData, req.body);
      return res.status(201).json(data);
    } catch (error) {
      return res.status(400).json(utils.formatError(error));
    }
  },

  handOverTakeOver: async (req, res) => {
    try {
      const toSend = await changeService.handoverTakeover(req.body, req.language);
      return res.json(toSend);
    } catch (error) {
      return res.status(400).json(utils.formatError(error));
    }
  },

  getRequestList: async (req, res) => {
    try {
      const data = await changeService.getRequestList(req.staffData);
      return res.json(data);
    } catch (error) {
      return res.status(400).json(utils.formatError(error));
    }
  },

  acceptRequest: async (req, res) => {
    try {     
      await changeService.acceptRequest(req.staffData, req.params.requestId, req.language);
      return res.status(202).json({message: utils.languageMapper(env.change.accept.success, req.language), requestId: req.params.requestId})
    } catch (error) {
      return res.status(400).json(utils.formatError(error));
    }
  },

  getTakeOrHandOverId: async (req, res) => {
    const status = req.params.status.toUpperCase();
    try {
      const data = await changeService.getTakeOrHandOverId(
        req.staffData,
        status
      );
      if(!data) throw utils.languageMapper(env.change.dAlo.notFound, req.language);
      return res.json(data);
    } catch (error) {
      return res.status(400).json(utils.formatError(error));
    }
  },

  upDateTakeOrHandOver: async (req, res) => {
    const { type } = req.body;
    const keyType = _.camelCase(
      type.substring(0, 4).concat('-', type.substring(4))
    );
    try {
      let images = req.body.images;
      let imageUrl = '';
      let allImages = [];
      for(key in images) {
        await moveFile(images[key]['url']);
        allImages.push({ url: imageUrl });
      }
      const data = await changeService.updateTakeOrHandOver(
        req.staffData,
        req.params.requestId,
        keyType,
        { ...req.body, images: allImages }
      );
      return res.json(data);
    } catch (error) {
      return res.status(400).json(utils.formatError(error));
    }
  }
};
