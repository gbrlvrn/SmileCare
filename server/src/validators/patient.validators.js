const {
  nameRule,
  emailRule,
  passwordRule,
  phoneRule,
  dateOfBirthRule,
  genderRule,
  textRule,
  booleanRule,
  listQueryRules,
  booleanQueryRule,
} = require('./common');

const listPatientsRules = [...listQueryRules, booleanQueryRule('isActive')];

const createPatientRules = [
  nameRule('firstName', 'First name'),
  nameRule('lastName', 'Last name'),
  emailRule(),
  passwordRule(),
  phoneRule(),
  dateOfBirthRule(),
  genderRule(),
  textRule('address', 'Address', 200),
  textRule('medicalNotes', 'Medical notes', 500),
];

const updatePatientRules = [
  nameRule('firstName', 'First name', { required: false }),
  nameRule('lastName', 'Last name', { required: false }),
  emailRule('email', { required: false }),
  passwordRule('password', 'Password', { required: false }),
  phoneRule(),
  dateOfBirthRule(),
  genderRule(),
  textRule('address', 'Address', 200),
  textRule('medicalNotes', 'Medical notes', 500),
  booleanRule('isActive', 'isActive'),
];

module.exports = { listPatientsRules, createPatientRules, updatePatientRules };
