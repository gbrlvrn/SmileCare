const express = require('express');
const {
  listAppointments,
  getAppointment,
  createAppointment,
  updateAppointment,
  updateStatus,
  updateTreatment,
  deleteAppointment,
} = require('../controllers/appointment.controller');
const {
  listAppointmentsRules,
  createAppointmentRules,
  updateAppointmentRules,
  updateStatusRules,
  treatmentRules,
} = require('../validators/appointment.validators');
const { validate, validateObjectId } = require('../middleware/validate');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();
const checkId = validateObjectId('Appointment');

// All appointment routes need a logged-in user. Ownership is checked in the controller.
router.use(protect);

router.get('/', listAppointmentsRules, validate, listAppointments);
router.post('/', authorize('patient', 'staff'), createAppointmentRules, validate, createAppointment);
router.get('/:id', checkId, getAppointment);
router.put('/:id', checkId, updateAppointmentRules, validate, updateAppointment);
router.patch('/:id/status', checkId, updateStatusRules, validate, updateStatus);

// Staff only
router.put('/:id/treatment', authorize('staff'), checkId, treatmentRules, validate, updateTreatment);
router.delete('/:id', authorize('staff'), checkId, deleteAppointment);

module.exports = router;
