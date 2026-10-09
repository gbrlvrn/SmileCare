const {
  nameRule,
  emailRule,
  passwordRule,
  phoneRule,
  booleanRule,
  listQueryRules,
  booleanQueryRule,
} = require('./common');

const listStaffRules = [...listQueryRules, booleanQueryRule('isActive')];

const createStaffRules = [
  nameRule('firstName', 'First name'),
  nameRule('lastName', 'Last name'),
  emailRule(),
  passwordRule(),
  phoneRule(),
];

const updateStaffRules = [
  nameRule('firstName', 'First name', { required: false }),
  nameRule('lastName', 'Last name', { required: false }),
  emailRule('email', { required: false }),
  phoneRule(),
  booleanRule('isActive', 'isActive'),
  passwordRule('password', 'Password', { required: false }),
];

module.exports = { listStaffRules, createStaffRules, updateStaffRules };
