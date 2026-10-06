const express = require('express');
const {
  listPatients,
  getPatient,
  createPatient,
  updatePatient,
  deletePatient,
} = require('../controllers/patient.controller');
const { listPatientsRules, createPatientRules, updatePatientRules } = require('../validators/patient.validators');
const { validate, validateObjectId } = require('../middleware/validate');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Every patient-management route is staff only.
router.use(protect, authorize('staff'));

router.get('/', listPatientsRules, validate, listPatients);
router.post('/', createPatientRules, validate, createPatient);
router.get('/:id', validateObjectId('Patient'), getPatient);
router.put('/:id', validateObjectId('Patient'), updatePatientRules, validate, updatePatient);
router.delete('/:id', validateObjectId('Patient'), deletePatient);

module.exports = router;
