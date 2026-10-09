const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ROLES, GENDERS } = require('../config/constants');

const SALT_ROUNDS = 12;

// Optional enum/date fields are stored as null when the client clears them ("").
const emptyToNull = (value) => (value === '' ? null : value);

/**
 * A person who can log in: either a patient or a clinic staff member.
 * Lengths of free-text fields (address, medicalNotes) are enforced by the validators.
 */
const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: [true, 'First name is required'], trim: true, maxlength: 50 },
    lastName: { type: String, required: [true, 'Last name is required'], trim: true, maxlength: 50 },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 100,
    },
    // select:false -> never returned by queries unless explicitly requested with .select('+password')
    password: { type: String, required: [true, 'Password is required'], minlength: 8, select: false },
    role: { type: String, enum: Object.values(ROLES), default: ROLES.PATIENT },
    phone: { type: String, trim: true, default: '' },
    dateOfBirth: { type: String, default: null, set: emptyToNull }, // "YYYY-MM-DD"
    gender: { type: String, enum: GENDERS, default: null, set: emptyToNull },
    address: { type: String, trim: true, default: '' },
    medicalNotes: { type: String, trim: true, default: '' }, // patients only
    isActive: { type: Boolean, default: true },
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date, default: null },
    lastFailedLogin: { type: Date, default: null },
  },
  {
    timestamps: true,
    id: false,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: (doc, ret) => {
        delete ret.password; // defence in depth: never serialise the hash
        delete ret.failedLoginAttempts;
        delete ret.lockUntil;
        delete ret.lastFailedLogin;
        return ret;
      },
    },
  }
);

userSchema.virtual('fullName').get(function fullName() {
  return `${this.firstName} ${this.lastName}`;
});

userSchema.virtual('isLocked').get(function isLocked() {
  return Boolean(this.lockUntil && this.lockUntil.getTime() > Date.now());
});

userSchema.index({ role: 1, createdAt: -1 });

// Hash the password whenever it is new or changed.
userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
});

/** Compares a plain-text candidate with the stored bcrypt hash. */
userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', userSchema);
