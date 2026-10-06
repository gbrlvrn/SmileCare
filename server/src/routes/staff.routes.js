const express = require('express');
const { listStaff, createStaff, updateStaff, deleteStaff } = require('../controllers/staff.controller');
const { listStaffRules, createStaffRules, updateStaffRules } = require('../validators/staff.validators');
const { validate, validateObjectId } = require('../middleware/validate');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect, authorize('staff'));

router.get('/', listStaffRules, validate, listStaff);
router.post('/', createStaffRules, validate, createStaff);
router.put('/:id', validateObjectId('Staff account'), updateStaffRules, validate, updateStaff);
router.delete('/:id', validateObjectId('Staff account'), deleteStaff);

module.exports = router;
