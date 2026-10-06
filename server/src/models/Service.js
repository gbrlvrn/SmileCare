const mongoose = require('mongoose');
const { SERVICE_DURATIONS } = require('../config/constants');

/** A dental service offered by the clinic (e.g. Teeth Cleaning). */
const serviceSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Service name is required'], unique: true, trim: true, maxlength: 100 },
    description: { type: String, trim: true, default: '' },
    durationMinutes: {
      type: Number,
      required: [true, 'Duration is required'],
      enum: { values: SERVICE_DURATIONS, message: 'Duration must be 30, 60, 90 or 120 minutes' },
    },
    price: { type: Number, required: [true, 'Price is required'], min: [0, 'Price cannot be negative'] }, // PHP
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toJSON: { versionKey: false },
  }
);

module.exports = mongoose.model('Service', serviceSchema);
