const inspectionUtils = require('../../helpers/inspectionUtils');
const utils = require('../../helpers/utils');
const { formatError } = require('../../helpers/utils');
const inspectionService = require('../../services/qi/inspection.service');
const { moveFile } = require('../../helpers/aws');

module.exports = {
  // getInspectionTypes: async (req, res) => {
  //   try {
  //     const types = await inspectionService.getInspectionTypes;
  //     return res.json(utils.getDropdownList(types, req.language));
  //   } catch (error) {
  //     return res.status(400).json(formatError(error));
  //   }
  // },
  getInspectionTypeFields: async (req, res) => {
    try {
      if (!['driver', 'vehicle'].includes(req.params.type))
        return res
          .status(404)
          .json({ message: 'Feild Types are not avaialble for this inspection type' });
      const inspectionFields = await inspectionService.getInspectionTypeFields(req.params.type);
      return res.json(
        inspectionUtils.normalizeAllLabelsFromNestings(inspectionFields, req.language)
      );
    } catch (error) {
      return res
        .status(404)
        .json({ message: 'Feild Types are not avaialble for this inspection type' });
    }
  },
  getInspectionList: async (req, res) => {
    try {
      const data = await inspectionService.getInspectionList(req.inspector, {
        $top: 20,
        $skip: 0,
        ...req.query
      });
      if(!req.query.$pageRef && data?.[0]?.ModifiedDateTime1){
        res.set('$pageRef', data?.[0]?.ModifiedDateTime1);
      }
      return res.json(data);
    } catch (error) {
      return res.status(400).json(utils.formatError(error));
    }
  },
  createInspection: async (req, res) => {
    try {
      if (!req.body.type) throw 'Type is required in body payload';
      if (!['Vehicle Inspection', 'Driver Inspection'].includes(req.body.type))
        return res
          .status(404)
          .json({
            message: 'Field Types are not avaialble for this inspection type',
            enum: ['Vehicle Inspection', 'Driver Inspection']
          });
      let numberOfFailStatus = 0;

      for (let i = 0; i < req.body.items.length; i++) {
        const e = req.body.items[i];
        e.number = i + 1;
        if (!e.status && e.critical) {
          numberOfFailStatus += 1;
        }
        e.imageUrl = await moveFile(e.imageUrl)

        if (e.images) {
          e.images = await Promise.all(e.images.map(async (image) => {
            image.url = await moveFile(image.url)
            return image
          }));
        }
      }

      if (numberOfFailStatus >= 5) {
        // do maintenance api request
        const maintenance = await inspectionService.createMaintenence(req.inspector, {
          driverId: req.body.driverId,
          notes: `${req.body.type} ${req.body.carsTaxiNumber}`,
          carsTaxiNumber: req.body.carsTaxiNumber
        });
        req.body.maintenance = {
          id: maintenance.referenceId,
          required: '1',
          type: 'Inspection'
        };
      }

      const data = await inspectionService.createInspection(req.inspector, req.body);
      return res.status(201).json(data);
    } catch (error) {
      return res.status(400).json(formatError(error));
    }
  },

  updateInspection: async (req, res) => {
    try {
      if (!req.body.type) throw 'Type is required in body payload';
      if (!['Handover', 'Takeover'].includes(req.body.type))
        return res
          .status(404)
          .json({
            message: 'Field Types are not avaialble for this inspection type',
            enum: ['Handover', 'Takeover']
          });
      if (req.body.maintenanceRequired) {
        req.body.maintenance = {
          required: '1',
          type: req.body.maintenanceRequestType
        };
      }

      // if (req.body.maintenanceRequired && req.body.type == 'Takeover') {
      //   // do maintenance api request
      //   const maintenance = await inspectionService.createMaintenence(req.inspector, {
      //     driverId: req.body.driverId,
      //     notes: `${req.body.type} ${req.body.carsTaxiNumber}`,
      //     maintenanceRequestType: req.body.maintenanceRequestType,
      //     carsTaxiNumber: req.body.carsTaxiNumber
      //   });
      //   req.body.maintenance = {
      //     id: maintenance.referenceId,
      //     required: '1',
      //     type: req.body.maintenanceType
      //   };
      // }

      if (req.body.imageUrl) {
        for (const key in req.body.imageUrl) {
          req.body.imageUrl[key] = await moveFile(req.body.imageUrl[key])
        }
        req.body.imageUrl = [req.body.imageUrl];
      }
      if (req.body.faults?.length) {
        for (const fault of req.body.faults) {
          fault.imageURL = await moveFile(fault.imageURL)
        }
      }

      const data = await inspectionService.updateInspection(
        req.inspector,
        req.params.requestId,
        req.body
      );
      // if(req.body.type == 'Takeover'){
      //   return res.status(202).json(data);
      // }
      // if (req.body.maintenanceRequired && req.body.type == 'Handover') {
      //   const maintenance = await inspectionService.createMaintenence(req.inspector, {
      //     driverId: req.body.driverId,
      //     notes: `${req.body.type} ${req.body.carsTaxiNumber}`,
      //     maintenanceRequestType: req.body.maintenanceRequestType,
      //     carsTaxiNumber: req.body.carsTaxiNumber
      //   });
        
      // }
      return res.status(202).json(data);
    } catch (error) {
      return res.status(400).json(formatError(error));
    }
  },

  getInspectionDrivers: async (req, res) => {
    try {
      const data = await inspectionService.getInspectionDrivers(
        req.inspector,
        req.params.ctNumber
      );
      return res.json(data);
    } catch (error) {
      return res.status(400).json(utils.formatError(error));
    }
  },
};
