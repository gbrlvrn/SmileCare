const express = require('express');

const router = express.Router();

// Every resource router is mounted here under /api (see app.js).
router.use('/auth', require('./auth.routes'));
router.use('/users', require('./user.routes'));
router.use('/patients', require('./patient.routes'));
router.use('/staff', require('./staff.routes'));
router.use('/dentists', require('./dentist.routes'));
router.use('/services', require('./service.routes'));
router.use('/appointments', require('./appointment.routes'));
router.use('/dashboard', require('./dashboard.routes'));

module.exports = router;
