const express = require('express');
const {
  listServices,
  getService,
  createService,
  updateService,
  deleteService,
} = require('../controllers/service.controller');
const { listServicesRules, createServiceRules, updateServiceRules } = require('../validators/service.validators');
const { validate, validateObjectId } = require('../middleware/validate');
const { protect, optionalAuth, authorize } = require('../middleware/auth');

const router = express.Router();
const checkId = validateObjectId('Service');

// Public (optionalAuth lets staff see inactive services)
router.get('/', optionalAuth, listServicesRules, validate, listServices);
router.get('/:id', optionalAuth, checkId, getService);

// Staff only
router.post('/', protect, authorize('staff'), createServiceRules, validate, createService);
router.put('/:id', protect, authorize('staff'), checkId, updateServiceRules, validate, updateService);
router.delete('/:id', protect, authorize('staff'), checkId, deleteService);

module.exports = router;
