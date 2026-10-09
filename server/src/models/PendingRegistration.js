const mongoose = require('mongoose');

/**
 * Temporary storage for pending user sign-ups awaiting 6-digit email OTP verification.
 * Automatically removed by MongoDB after 10 minutes via TTL index.
 */
const pendingRegistrationSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    otp: {
      type: String,
      required: true,
    },
    userData: {
      firstName: { type: String, required: true, trim: true },
      lastName: { type: String, required: true, trim: true },
      email: { type: String, required: true, lowercase: true, trim: true },
      password: { type: String, required: true },
      phone: { type: String, trim: true, default: '' },
      address: { type: String, trim: true, default: '' },
      dateOfBirth: { type: String, default: null },
      gender: { type: String, default: null },
    },
    attempts: {
      type: Number,
      default: 0,
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    },
  },
  {
    timestamps: true,
  }
);

// MongoDB automatically deletes expired pending registrations when expiresAt is reached
pendingRegistrationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('PendingRegistration', pendingRegistrationSchema);
