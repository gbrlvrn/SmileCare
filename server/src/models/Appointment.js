const mongoose = require('mongoose');
const { APPOINTMENT_STATUSES } = require('../config/constants');

const { ObjectId } = mongoose.Schema.Types;

/** Treatment notes recorded by staff after a completed visit. */
const treatmentSchema = new mongoose.Schema(
  {
    diagnosis: { type: String, trim: true, default: '' },
    procedure: { type: String, trim: true, default: '' },
    notes: { type: String, trim: true, default: '' },
    prescription: { type: String, trim: true, default: '' },
    followUpDate: { type: String, default: null }, // "YYYY-MM-DD"
    recordedBy: { type: ObjectId, ref: 'User' },
    recordedAt: { type: Date },
  },
  { _id: false }
);

const appointmentSchema = new mongoose.Schema(
  {
    patient: { type: ObjectId, ref: 'User', required: [true, 'Patient is required'] },
    dentist: { type: ObjectId, ref: 'Dentist', required: [true, 'Dentist is required'] },
    service: { type: ObjectId, ref: 'Service', required: [true, 'Service is required'] },
    services: [{ type: ObjectId, ref: 'Service' }],
    date: { type: String, required: [true, 'Date is required'] }, // "YYYY-MM-DD" clinic-local
    startTime: { type: String, required: [true, 'Start time is required'] }, // "HH:mm"
    endTime: { type: String, required: true }, // computed: startTime + service duration
    status: { type: String, enum: APPOINTMENT_STATUSES, default: 'pending' },
    reason: { type: String, trim: true, default: '' },
    cancellationReason: { type: String, trim: true, default: null },
    treatment: { type: treatmentSchema, default: null },
    // true while the appointment occupies its time slot (i.e. not cancelled / no-show).
    // Used by the unique partial index below to make double booking impossible.
    slotActive: { type: Boolean, default: true },
    createdBy: { type: ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
    toJSON: {
      versionKey: false,
      transform: (doc, ret) => {
        delete ret.slotActive; // internal field
        return ret;
      },
    },
  }
);

// Keep slotActive and service/services in sync before every validation/save.
appointmentSchema.pre('validate', function syncFields() {
  this.slotActive = !['cancelled', 'no-show'].includes(this.status);
  if (this.services && this.services.length > 0 && !this.service) {
    this.service = this.services[0];
  } else if (this.service && (!this.services || this.services.length === 0)) {
    this.services = [this.service];
  }
});

// Database-level guarantee: one active booking per dentist per start time.
// (Overlaps of multi-slot services are checked in the application layer.)
appointmentSchema.index(
  { dentist: 1, date: 1, startTime: 1 },
  { unique: true, partialFilterExpression: { slotActive: true } }
);
appointmentSchema.index({ patient: 1, date: -1 });
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ date: 1, startTime: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
