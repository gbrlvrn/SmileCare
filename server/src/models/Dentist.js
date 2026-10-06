const mongoose = require('mongoose');

/**
 * A dentist working at the clinic. Dentists are records managed by staff;
 * they do not log in.
 */
const dentistSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: [true, 'First name is required'], trim: true, maxlength: 50 },
    lastName: { type: String, required: [true, 'Last name is required'], trim: true, maxlength: 50 },
    specialization: { type: String, required: [true, 'Specialization is required'], trim: true, maxlength: 100 },
    email: { type: String, lowercase: true, trim: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    bio: { type: String, trim: true, default: '' },
    // 0 = Sunday ... 6 = Saturday (the clinic is closed on Sunday, so 0 is never stored)
    workingDays: {
      type: [Number],
      validate: {
        validator: (days) => days.length > 0 && days.every((d) => Number.isInteger(d) && d >= 1 && d <= 6),
        message: 'Working days must contain values from 1 (Monday) to 6 (Saturday)',
      },
    },
    startTime: { type: String, required: [true, 'Start time is required'] }, // "HH:mm"
    endTime: { type: String, required: [true, 'End time is required'] }, // "HH:mm"
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    id: false,
    toJSON: { virtuals: true, versionKey: false },
  }
);

dentistSchema.virtual('fullName').get(function fullName() {
  return `Dr. ${this.firstName} ${this.lastName}`;
});

module.exports = mongoose.model('Dentist', dentistSchema);
