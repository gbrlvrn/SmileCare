const express = require('express');
const { patientDashboard, staffDashboard } = require('../controllers/dashboard.controller');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/patient', authorize('patient'), patientDashboard);
router.get('/staff', authorize('staff'), staffDashboard);

module.exports = router;
