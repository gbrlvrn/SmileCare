# SmileCare REST API Contract

> **Source of truth** shared by the backend and frontend. Any change must be reflected here.

- **Base URL:** `http://localhost:5000/api` (dev) — configured in the client as `VITE_API_URL`.
- **Format:** JSON request/response bodies. `Content-Type: application/json`. Body limit 10 kb.
- **Auth:** `Authorization: Bearer <JWT>` header. JWT payload `{ id, role }`, expires in `1d`.
- **Roles:** `patient`, `staff`.
- **Clinic rules:** Timezone `Asia/Manila`. Clinic open **Mon–Sat 09:00–17:00**. Slot granularity **30 min**. Each dentist also has their own `workingDays` and `startTime`/`endTime` (within clinic hours).
- **Dates/times:** `date` = `"YYYY-MM-DD"` string (clinic-local), `startTime`/`endTime` = `"HH:mm"` 24 h strings.

---

## 1. Response envelope

Success:
```json
{ "success": true, "data": <object|array>, "message": "optional", "pagination": { ... } }
```
`pagination` is present on list endpoints:
```json
{ "page": 1, "limit": 10, "total": 57, "totalPages": 6 }
```

Error:
```json
{ "success": false, "message": "Human readable message", "errors": [ { "field": "email", "message": "Email is required" } ] }
```

| Status | When |
|---|---|
| 200 | OK |
| 201 | Created |
| 400 | Bad request / business-rule violation (e.g. past date, outside hours, invalid status transition, <24 h cancel) |
| 401 | Missing/invalid/expired token, inactive user, wrong credentials |
| 403 | Authenticated but wrong role or not the owner |
| 404 | Resource not found (also for invalid ObjectId) |
| 409 | Conflict: duplicate email, service name, or **slot already booked** |
| 422 | Validation failed (`errors[]` contains field-level messages) |
| 429 | Rate limit exceeded |
| 500 | Server error (no stack trace in production) |

## 2. List query conventions

All list endpoints accept:
- `page` (default 1), `limit` (default 10, max 50)
- `search` — case-insensitive partial match (regex-escaped on the server)
- `sort` — optional, e.g. `-createdAt` (whitelisted fields only)

---

## 3. Data shapes

### User (never includes `password`)
```json
{
  "_id": "665f...", "firstName": "Juan", "lastName": "Dela Cruz", "fullName": "Juan Dela Cruz",
  "email": "juan@example.com", "role": "patient",
  "phone": "09171234567", "dateOfBirth": "1998-04-12", "gender": "male",
  "address": "Quezon City", "medicalNotes": "Allergic to penicillin",
  "isActive": true, "createdAt": "...", "updatedAt": "..."
}
```
- `gender`: `male | female | other | prefer_not_to_say`
- `phone`: PH mobile format `^(09|\+639)\d{9}$`
- `medicalNotes`: patient only, optional, max 500 chars

### Dentist
```json
{
  "_id": "...", "firstName": "Maria", "lastName": "Santos", "fullName": "Dr. Maria Santos",
  "specialization": "Orthodontics", "email": "maria.santos@smilecare.com", "phone": "09171234567",
  "bio": "10 years of experience...", "workingDays": [1,2,3,4,5,6],
  "startTime": "09:00", "endTime": "17:00", "isActive": true, "createdAt": "...", "updatedAt": "..."
}
```
- `workingDays`: integers 0–6 (0 = Sunday). Clinic is closed Sunday, so 0 is rejected.
- `startTime` < `endTime`, both within 09:00–17:00, on 30-min boundaries.

### Service
```json
{ "_id": "...", "name": "Teeth Cleaning", "description": "...", "durationMinutes": 30, "price": 1500, "isActive": true }
```
- `durationMinutes`: one of `30, 60, 90, 120`. `price`: number ≥ 0 (PHP).

### Appointment (populated)
```json
{
  "_id": "...",
  "patient": { "_id": "...", "firstName": "Juan", "lastName": "Dela Cruz", "fullName": "Juan Dela Cruz", "email": "...", "phone": "..." },
  "dentist": { "_id": "...", "firstName": "Maria", "lastName": "Santos", "fullName": "Dr. Maria Santos", "specialization": "Orthodontics" },
  "service": { "_id": "...", "name": "Teeth Cleaning", "durationMinutes": 30, "price": 1500 },
  "date": "2026-10-15", "startTime": "10:00", "endTime": "10:30",
  "status": "pending",
  "reason": "Tooth sensitivity on the left side",
  "cancellationReason": null,
  "treatment": {
    "diagnosis": "...", "procedure": "...", "notes": "...", "prescription": "...",
    "followUpDate": "2026-11-15", "recordedBy": "<staffUserId>", "recordedAt": "..."
  },
  "createdBy": "<userId>", "createdAt": "...", "updatedAt": "..."
}
```
- `status`: `pending | confirmed | completed | cancelled | no-show`
- `treatment` is `null` until staff record it (only allowed when `status = completed`).
- `endTime` is computed by the server: `startTime + service.durationMinutes`.

#### Status transitions (server-enforced)
| From | Allowed to (staff) | Allowed to (patient) |
|---|---|---|
| pending | confirmed, cancelled | cancelled (≥ 24 h before start) |
| confirmed | completed, cancelled, no-show | cancelled (≥ 24 h before start) |
| completed / cancelled / no-show | — (terminal) | — |

#### Booking rules (server-enforced, return 400 unless noted)
1. Date/time must be in the future (clinic timezone).
2. Day must be in the dentist's `workingDays` and not Sunday.
3. `startTime` on a 30-min boundary; `startTime`–`endTime` must fit inside the dentist's hours.
4. No overlap with another **active** (`pending`/`confirmed`/`completed`) appointment of the same dentist → **409**.
5. A patient cannot have two overlapping active appointments → **409**.
6. Dentist and service must be active.

---

## 4. Endpoints

### Auth — `/api/auth` (rate-limited: 10 req / 15 min / IP on login & register)

| Method | Path | Access | Body | Returns |
|---|---|---|---|---|
| POST | `/auth/register` | public | `{ firstName, lastName, email, password, confirmPassword, phone?, dateOfBirth?, gender? }` | 201 `{ token, user }` — role is **always** `patient` |
| POST | `/auth/login` | public | `{ email, password }` | 200 `{ token, user }` — 401 `"Invalid email or password"` (generic) |
| GET | `/auth/me` | auth | — | 200 `user` |
| POST | `/auth/logout` | auth | — | 200 `{ message }` (stateless; client discards token) |

Password policy: 8–64 chars, at least one uppercase, one lowercase, one digit.

### Profile — `/api/users`

| Method | Path | Access | Body | Returns |
|---|---|---|---|---|
| PUT | `/users/me` | auth | `{ firstName?, lastName?, phone?, dateOfBirth?, gender?, address?, medicalNotes? }` (email/role/isActive ignored) | 200 `user` |
| PUT | `/users/me/password` | auth | `{ currentPassword, newPassword, confirmPassword }` | 200 `{ message }` — 400 if current wrong |

### Services — `/api/services`

| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/services` | public | Active only for public/patients. Staff can pass `?all=true` to include inactive. Supports `search`, `page`, `limit` (if `page` omitted, returns all as array without pagination). |
| GET | `/services/:id` | public | |
| POST | `/services` | staff | `{ name, description?, durationMinutes, price, isActive? }` → 201 |
| PUT | `/services/:id` | staff | partial update |
| DELETE | `/services/:id` | staff | 400 if the service has upcoming active appointments (suggest deactivating instead) |

### Dentists — `/api/dentists`

| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/dentists` | public | Active only unless staff passes `?all=true`. `search` matches name/specialization. Same pagination behaviour as services. |
| GET | `/dentists/:id` | public | |
| GET | `/dentists/:id/availability?date=YYYY-MM-DD&serviceId=...&excludeAppointmentId=...` | auth | 200 `{ date, dentistId, serviceId, slots: [ { startTime: "09:00", endTime: "09:30", available: true } ] }`. Returns `slots: []` with a `message` if the dentist doesn't work that day. Past slots marked unavailable. `excludeAppointmentId` lets rescheduling ignore the appointment's own slot. |
| POST | `/dentists` | staff | `{ firstName, lastName, specialization, email?, phone?, bio?, workingDays, startTime, endTime, isActive? }` → 201 |
| PUT | `/dentists/:id` | staff | partial update |
| DELETE | `/dentists/:id` | staff | 400 if the dentist has upcoming active appointments |

### Appointments — `/api/appointments`

| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/appointments` | auth | Query: `page, limit, search, status, dentist, from, to, upcoming=true\|false, sort`. **Patient** → only their own. **Staff** → all; `search` matches patient name/email, dentist name, service name. Default sort: `date` desc, `startTime` desc (for `upcoming=true`: ascending). |
| GET | `/appointments/:id` | owner patient or staff | 403 if not owner |
| POST | `/appointments` | patient or staff | Patient: `{ dentist, service, date, startTime, reason? }` (patient = self). Staff: same + required `patient` id. Created with `status: "pending"` (staff may pass `status: "confirmed"`). → 201 populated appointment |
| PUT | `/appointments/:id` | owner patient / staff | Reschedule/edit: `{ dentist?, service?, date?, startTime?, reason? }`. Patient only while `pending`/`confirmed` and ≥ 24 h before current start; rescheduling resets status to `pending`. Staff: any non-terminal appointment. |
| PATCH | `/appointments/:id/status` | owner patient / staff | `{ status, cancellationReason? }` — see transition table. |
| PUT | `/appointments/:id/treatment` | staff | `{ diagnosis, procedure, notes?, prescription?, followUpDate? }` — only when `status = completed`. |
| DELETE | `/appointments/:id` | staff | Hard delete. 200 `{ message }` |

### Patients (staff management) — `/api/patients` (staff only)

| Method | Path | Notes |
|---|---|---|
| GET | `/patients` | `search` (name/email/phone), `isActive`, `page`, `limit`. Each item includes `appointmentCount`. |
| GET | `/patients/:id` | `{ patient, appointments: [...] }` (all appointments, newest first) |
| POST | `/patients` | `{ firstName, lastName, email, password, phone?, dateOfBirth?, gender?, address?, medicalNotes? }` → 201 (walk-in registration) |
| PUT | `/patients/:id` | profile fields + `isActive`; optional `password` to reset |
| DELETE | `/patients/:id` | Deletes patient **and** their appointments. 200 `{ message }` |

### Staff accounts — `/api/staff` (staff only)

| Method | Path | Notes |
|---|---|---|
| GET | `/staff` | `search`, `page`, `limit` |
| POST | `/staff` | `{ firstName, lastName, email, password, phone? }` → 201 (role forced to `staff`) |
| PUT | `/staff/:id` | `{ firstName?, lastName?, phone?, isActive?, password? }`. Cannot deactivate self. |
| DELETE | `/staff/:id` | Cannot delete self (400). |

### Dashboard — `/api/dashboard`

**GET `/dashboard/patient`** (patient)
```json
{
  "nextAppointment": <Appointment|null>,
  "counts": { "upcoming": 2, "completed": 5, "cancelled": 1, "total": 8 },
  "recentAppointments": [<Appointment>, ...]   // last 5 by date desc
}
```

**GET `/dashboard/staff`** (staff)
```json
{
  "totals": { "patients": 42, "dentists": 4, "services": 6, "appointmentsToday": 7, "pending": 5 },
  "statusCounts": { "pending": 5, "confirmed": 12, "completed": 30, "cancelled": 4, "no-show": 2 },
  "todaySchedule": [<Appointment>, ...],         // sorted by startTime
  "trend": [ { "date": "2026-09-24", "count": 3 }, ... ],   // last 14 days incl. today, zero-filled
  "topServices": [ { "serviceId": "...", "name": "Teeth Cleaning", "count": 18 }, ... ]  // top 5
}
```

---

## 5. Seeded accounts (`npm run seed`)

| Role | Email | Password |
|---|---|---|
| Staff (admin) | `SEED_ADMIN_EMAIL` (default `admin@smilecare.com`) | `SEED_ADMIN_PASSWORD` from `server/.env` |
| Staff | `staff@smilecare.com` | `Staff@12345` |
| Patients | `patient1@smilecare.com` … `patient8@smilecare.com` | `Patient@123` |
