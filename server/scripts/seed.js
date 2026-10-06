/**
 * Seeds the SmileCare database with demo data.
 *
 *   npm run seed
 *
 * WARNING: wipes the users, dentists, services and appointments collections first.
 * Appointments are generated around "today" (clinic timezone) with a seeded
 * pseudo-random generator, so the result is reproducible for a given day.
 */
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env'), quiet: true });

const mongoose = require('mongoose');
const connectDB = require('../src/config/db');
const User = require('../src/models/User');
const Dentist = require('../src/models/Dentist');
const Service = require('../src/models/Service');
const Appointment = require('../src/models/Appointment');
const { clinicNow, addDays, dayOfWeek, toMinutes, fromMinutes } = require('../src/utils/time');
const { rangesOverlap } = require('../src/utils/slots');

const PATIENT_PASSWORD = 'Patient@123';
const STAFF_PASSWORD = 'Staff@12345';
const DAYS_AROUND_TODAY = 14;

/* ------------------------------------------------------------------ */
/* Deterministic pseudo-random generator (mulberry32)                   */
/* ------------------------------------------------------------------ */
function mulberry32(seed) {
  let state = seed;
  return function next() {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const random = mulberry32(20261007);
const randomItem = (items) => items[Math.floor(random() * items.length)];
const chance = (probability) => random() < probability;

/* ------------------------------------------------------------------ */
/* Static demo data                                                    */
/* ------------------------------------------------------------------ */
const SERVICES = [
  {
    name: 'Dental Check-up',
    durationMinutes: 30,
    price: 500,
    description: 'Complete oral examination with dental charting and personalised hygiene advice.',
  },
  {
    name: 'Teeth Cleaning',
    durationMinutes: 60,
    price: 1500,
    description: 'Professional scaling and polishing to remove plaque and tartar build-up.',
  },
  {
    name: 'Tooth Extraction',
    durationMinutes: 60,
    price: 2500,
    description: 'Safe removal of damaged or decayed teeth under local anesthesia.',
  },
  {
    name: 'Teeth Whitening',
    durationMinutes: 90,
    price: 8000,
    description: 'In-office whitening treatment for a brighter smile in a single visit.',
  },
  {
    name: 'Root Canal Treatment',
    durationMinutes: 120,
    price: 12000,
    description: 'Treatment of infected tooth pulp to relieve pain and save the natural tooth.',
  },
  {
    name: 'Braces Consultation',
    durationMinutes: 30,
    price: 1000,
    description: 'Orthodontic assessment and discussion of braces and aligner options.',
  },
];

const DENTISTS = [
  {
    firstName: 'Maria',
    lastName: 'Santos',
    specialization: 'General Dentistry',
    email: 'maria.santos@smilecare.com',
    phone: '09171234501',
    bio: 'Over 10 years of experience in preventive and restorative dentistry for the whole family.',
    workingDays: [1, 2, 3, 4, 5, 6],
    startTime: '09:00',
    endTime: '17:00',
    services: ['Dental Check-up', 'Teeth Cleaning', 'Tooth Extraction'],
  },
  {
    firstName: 'Jose',
    lastName: 'Ramirez',
    specialization: 'Orthodontics',
    email: 'jose.ramirez@smilecare.com',
    phone: '09181234502',
    bio: 'Orthodontist focused on braces and clear aligners for teens and adults.',
    workingDays: [1, 3, 5],
    startTime: '09:00',
    endTime: '17:00',
    services: ['Braces Consultation', 'Dental Check-up'],
  },
  {
    firstName: 'Patricia',
    lastName: 'Tan',
    specialization: 'Endodontics',
    email: 'patricia.tan@smilecare.com',
    phone: '09191234503',
    bio: 'Endodontist specialising in pain-free root canal treatment and tooth preservation.',
    workingDays: [2, 4, 6],
    startTime: '09:00',
    endTime: '16:00',
    services: ['Root Canal Treatment', 'Tooth Extraction', 'Dental Check-up'],
  },
  {
    firstName: 'Miguel',
    lastName: 'Fernandez',
    specialization: 'Pediatric and Cosmetic Dentistry',
    email: 'miguel.fernandez@smilecare.com',
    phone: '09201234504',
    bio: 'Gentle care for children and cosmetic treatments such as whitening for adults.',
    workingDays: [1, 2, 3, 4, 5],
    startTime: '10:00',
    endTime: '17:00',
    services: ['Teeth Whitening', 'Teeth Cleaning', 'Dental Check-up'],
  },
];

const PATIENTS = [
  ['Juan', 'Dela Cruz', 'male', '1990-05-14', '09171112201', 'Quezon City', 'Allergic to penicillin'],
  ['Angelica', 'Reyes', 'female', '1995-09-02', '09181112202', 'Makati City', ''],
  ['Mark Anthony', 'Bautista', 'male', '1988-12-21', '09191112203', 'Pasig City', 'Hypertensive, on maintenance medication'],
  ['Kristine Mae', 'Garcia', 'female', '2001-03-30', '09201112204', 'Taguig City', ''],
  ['Paolo', 'Villanueva', 'male', '1993-07-08', '09171112205', 'Manila', 'Asthmatic'],
  ['Camille', 'Aquino', 'female', '1998-11-17', '09181112206', 'Mandaluyong City', ''],
  ['Rafael', 'Castillo', 'male', '1985-01-25', '09191112207', 'Caloocan City', 'Diabetic, Type 2'],
  ['Andrea', 'Lim', 'female', '2003-06-12', '09201112208', 'Cebu City', ''],
];

const REASONS = [
  'Routine check-up',
  'Tooth sensitivity when drinking cold water',
  'Bleeding gums when brushing',
  'Pain on the lower right molar',
  'Wants a brighter smile before a wedding',
  'Follow-up from previous visit',
  'Chipped front tooth',
  '',
];

const CANCELLATION_REASONS = [
  'Schedule conflict at work',
  'Feeling unwell',
  'Travelling out of town',
  'Will book again next month',
];

// Realistic treatment notes per service.
const TREATMENTS = {
  'Dental Check-up': {
    diagnosis: 'Mild plaque build-up, no cavities detected',
    procedure: 'Oral examination and dental charting',
    notes: 'Advised to floss daily and reduce sugary drinks',
    prescription: '',
    followUpDays: 180,
  },
  'Teeth Cleaning': {
    diagnosis: 'Moderate tartar on lower front teeth with mild gingivitis',
    procedure: 'Scaling and polishing',
    notes: 'Recommended a soft-bristle toothbrush',
    prescription: 'Chlorhexidine mouthwash 0.12 percent, rinse twice daily for 7 days',
    followUpDays: 180,
  },
  'Tooth Extraction': {
    diagnosis: 'Non-restorable decayed lower molar',
    procedure: 'Simple extraction under local anesthesia',
    notes: 'Bite on gauze for 30 minutes and avoid hot drinks for 24 hours',
    prescription: 'Mefenamic acid 500 mg every 8 hours as needed; Amoxicillin 500 mg every 8 hours for 7 days',
    followUpDays: 7,
  },
  'Teeth Whitening': {
    diagnosis: 'Extrinsic staining from coffee and tea',
    procedure: 'In-office whitening, 3 cycles of 15 minutes',
    notes: 'Avoid coffee, tea and red wine for 48 hours',
    prescription: 'Desensitizing toothpaste twice daily',
    followUpDays: null,
  },
  'Root Canal Treatment': {
    diagnosis: 'Irreversible pulpitis on upper premolar',
    procedure: 'Root canal therapy: access opening, cleaning, shaping and temporary filling',
    notes: 'Crown recommended after the final session',
    prescription: 'Ibuprofen 400 mg every 6 hours as needed for pain',
    followUpDays: 14,
  },
  'Braces Consultation': {
    diagnosis: 'Class II malocclusion with mild crowding',
    procedure: 'Orthodontic assessment, photos and impressions',
    notes: 'Discussed metal and ceramic braces options and estimated treatment time',
    prescription: '',
    followUpDays: 30,
  },
};

/* ------------------------------------------------------------------ */
/* Appointment generation                                              */
/* ------------------------------------------------------------------ */

/** Keeps track of booked minute ranges per dentist/patient per day to avoid overlaps. */
function createBusyTracker() {
  const busy = new Map();
  const key = (id, date) => `${id}|${date}`;
  return {
    isFree(id, date, start, end) {
      return (busy.get(key(id, date)) || []).every((r) => !rangesOverlap(start, end, r.start, r.end));
    },
    add(id, date, start, end) {
      const k = key(id, date);
      busy.set(k, [...(busy.get(k) || []), { start, end }]);
    },
  };
}

function pastStatus() {
  const roll = random();
  if (roll < 0.76) return 'completed';
  if (roll < 0.88) return 'cancelled';
  return 'no-show';
}

function generateAppointments({ dentists, servicesByName, patients, staffUsers }) {
  const now = clinicNow();
  const tracker = createBusyTracker();
  const appointments = [];

  for (let offset = -DAYS_AROUND_TODAY; offset <= DAYS_AROUND_TODAY; offset += 1) {
    const date = addDays(now.date, offset);
    const day = dayOfWeek(date);
    const working = dentists.filter((d) => d.workingDays.includes(day));
    if (working.length === 0) continue; // Sunday

    let target;
    if (offset === 0) target = 5;
    else target = chance(0.4) ? 3 : 2;

    let created = 0;
    for (let attempt = 0; attempt < 60 && created < target; attempt += 1) {
      const dentist = randomItem(working);
      const service = servicesByName[randomItem(dentist.seedServices)];
      const patient = randomItem(patients);

      // Candidate start times on the 30-minute grid that fit the dentist's hours
      const dayStart = toMinutes(dentist.startTime);
      const dayEnd = toMinutes(dentist.endTime);
      const starts = [];
      for (let m = dayStart; m + service.durationMinutes <= dayEnd; m += 30) starts.push(m);
      const start = randomItem(starts);
      const end = start + service.durationMinutes;

      if (!tracker.isFree(dentist._id, date, start, end) || !tracker.isFree(patient._id, date, start, end)) continue;
      tracker.add(dentist._id, date, start, end);
      tracker.add(patient._id, date, start, end);

      const isPast = date < now.date || (date === now.date && start <= now.minutes);
      const status = isPast ? pastStatus() : randomItem(['pending', 'confirmed', 'confirmed']);
      const bookedByStaff = chance(0.3);

      const appointment = {
        patient: patient._id,
        dentist: dentist._id,
        service: service._id,
        date,
        startTime: fromMinutes(start),
        endTime: fromMinutes(end),
        status,
        reason: randomItem(REASONS),
        cancellationReason: status === 'cancelled' ? randomItem(CANCELLATION_REASONS) : null,
        createdBy: bookedByStaff ? randomItem(staffUsers)._id : patient._id,
      };

      if (status === 'completed') {
        const { followUpDays, ...notes } = TREATMENTS[service.name];
        appointment.treatment = {
          ...notes,
          followUpDate: followUpDays ? addDays(date, followUpDays) : null,
          recordedBy: randomItem(staffUsers)._id,
          recordedAt: new Date(`${date}T${fromMinutes(end)}:00+08:00`),
        };
      }

      appointments.push(appointment);
      created += 1;
    }
  }

  return appointments;
}

/* ------------------------------------------------------------------ */
/* Main                                                                */
/* ------------------------------------------------------------------ */
async function seed() {
  const adminEmail = (process.env.SEED_ADMIN_EMAIL || 'admin@smilecare.com').toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (!process.env.MONGODB_URI || !adminPassword) {
    throw new Error('MONGODB_URI and SEED_ADMIN_PASSWORD must be set in server/.env');
  }

  await connectDB();

  console.log('Clearing collections...');
  await Promise.all([User, Dentist, Service, Appointment].map((Model) => Model.deleteMany({})));
  await Promise.all([User, Dentist, Service, Appointment].map((Model) => Model.syncIndexes()));

  console.log('Creating staff and patients...');
  // User.create runs the pre-save hook, so every password is bcrypt-hashed.
  const staffUsers = await User.create([
    { firstName: 'Clinic', lastName: 'Admin', email: adminEmail, password: adminPassword, role: 'staff', phone: '09170000001' },
    { firstName: 'Liza', lastName: 'Mendoza', email: 'staff@smilecare.com', password: STAFF_PASSWORD, role: 'staff', phone: '09170000002' },
  ]);

  const patients = await User.create(
    PATIENTS.map(([firstName, lastName, gender, dateOfBirth, phone, address, medicalNotes], i) => ({
      firstName,
      lastName,
      email: `patient${i + 1}@smilecare.com`,
      password: PATIENT_PASSWORD,
      role: 'patient',
      gender,
      dateOfBirth,
      phone,
      address,
      medicalNotes,
    }))
  );

  console.log('Creating services and dentists...');
  const services = await Service.create(SERVICES);
  const servicesByName = Object.fromEntries(services.map((s) => [s.name, s]));

  const dentistDocs = await Dentist.create(DENTISTS.map(({ services: _unused, ...dentist }) => dentist));
  const dentists = dentistDocs.map((doc, i) => Object.assign(doc, { seedServices: DENTISTS[i].services }));

  console.log('Creating appointments...');
  const appointmentData = generateAppointments({ dentists, servicesByName, patients, staffUsers });
  const appointments = await Appointment.create(appointmentData);

  const byStatus = appointments.reduce((acc, a) => ({ ...acc, [a.status]: (acc[a.status] || 0) + 1 }), {});
  const today = clinicNow().date;

  console.log('\nSeed complete.');
  console.log(`  Services: ${services.length}, Dentists: ${dentists.length}, Patients: ${patients.length}, Staff: ${staffUsers.length}`);
  console.log(`  Appointments: ${appointments.length} (today ${today}: ${appointments.filter((a) => a.date === today).length})`);
  console.log(`  By status: ${JSON.stringify(byStatus)}\n`);

  console.table([
    { role: 'staff (admin)', email: adminEmail, password: '(SEED_ADMIN_PASSWORD in server/.env)' },
    { role: 'staff', email: 'staff@smilecare.com', password: STAFF_PASSWORD },
    ...patients.map((p) => ({ role: 'patient', email: p.email, password: PATIENT_PASSWORD })),
  ]);
}

seed()
  .catch((err) => {
    console.error(`Seed failed: ${err.message}`);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
