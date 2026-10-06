const express = require('express');
const { updateProfile, changePassword } = require('../controllers/user.controller');
const { updateProfileRules, changePasswordRules } = require('../validators/user.validators');
const { validate } = require('../middleware/validate');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.put('/me', updateProfileRules, validate, updateProfile);
router.put('/me/password', changePasswordRules, validate, changePassword);

module.exports = router;
