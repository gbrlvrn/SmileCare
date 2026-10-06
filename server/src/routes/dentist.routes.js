const express = require('express');
const {
  listDentists,
  getDentist,
  getAvailability,
  createDentist,
  updateDentist,
  deleteDentist,
} = require('../controllers/dentist.controller');
const {
  listDentistsRules,
  createDentistRules,
  updateDentistRules,
  availabilityRules,
} = require('../validators/dentist.validators');
const { validate, validateObjectId } = require('../middleware/validate');
const { protect, optionalAuth, authorize } = require('../middleware/auth');

const router = express.Router();
const checkId = validateObjectId('Dentist');

// Public (optionalAuth lets staff see inactive dentists)
router.get('/', optionalAuth, listDentistsRules, validate, listDentists);
router.get('/:id', optionalAuth, checkId, getDentist);

// Logged-in users
router.get('/:id/availability', protect, checkId, availabilityRules, validate, getAvailability);

// Staff only
router.post('/', protect, authorize('staff'), createDentistRules, validate, createDentist);
router.put('/:id', protect, authorize('staff'), checkId, updateDentistRules, validate, updateDentist);
router.delete('/:id', protect, authorize('staff'), checkId, deleteDentist);

module.exports = router;
