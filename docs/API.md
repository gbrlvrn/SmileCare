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

Also: `400` for malformed JSON, `413` for bodies > 10 kb. An invalid ObjectId in the **URL** (`/:id`) returns `404 "<Resource> not found"`; an invalid ObjectId in the **body or query** (e.g. `dentist`, `serviceId`) returns `422`.

## 2. List query conventions

All list endpoints accept:
- `page` (default 1), `limit` (default 10, max 50 — larger values are clamped to 50)
- `search` — case-insensitive partial match (regex-escaped on the server), max 100 chars. Person names also match the full name (`"juan dela"`).
- `sort` — optional, e.g. `-createdAt` (whitelisted fields only; unknown fields fall back to the default sort)
  - appointments: `date`, `-date`, `createdAt`, `-createdAt`, `status`, `-status`
  - patients / staff: `firstName`, `lastName`, `email`, `createdAt` (default `-createdAt`)
  - services: `name`, `price`, `durationMinutes`, `createdAt` (default `name`)
  - dentists: `firstName`, `lastName`, `specialization`, `createdAt` (default `lastName`)

> **Free text:** free-text fields (`reason`, `cancellationReason`, `description`, `bio`, `address`, `medicalNotes`, treatment `diagnosis`/`procedure`/`notes`/`prescription`) are trimmed and HTML tags (and control characters) are stripped; there is **no entity encoding** — clients render them as plain text (React escapes output; never use `dangerouslySetInnerHTML`). E.g. `Patient's & co` round-trips unchanged; `<b>hi</b>` is stored as `hi`.
>
> **Clearing optional fields:** send `""` (or `null`) for an optional field to clear it (e.g. `phone`, `dateOfBirth`, `gender`, `address`, `medicalNotes`; dentist `email`/`phone`/`bio`; service `description`; treatment `notes`/`prescription`/`followUpDate`). Strings are stored as `""`; `dateOfBirth`, `gender` and `followUpDate` become `null`. Required fields (names, user `email`, …) cannot be cleared (422).

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
- `reason` defaults to `""`. `dentist` / `service` may be `null` in **historical** appointments whose dentist/service was later deleted (deletion is only allowed when there are no upcoming appointments) — the client should render a fallback such as "Deleted dentist".

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
| GET | `/dentists/:id/availability?date=YYYY-MM-DD&serviceId=...&excludeAppointmentId=...` | auth | 200 `{ date, dentistId, serviceId, slots: [ { startTime: "09:00", endTime: "09:30", available: true } ] }`. Returns `slots: []` with a `message` (both in the envelope `message` **and** `data.message`) if it is Sunday, the dentist doesn't work that day, or the dentist is inactive. Past slots marked unavailable. `excludeAppointmentId` lets rescheduling ignore the appointment's own slot (for patients it is only honoured if the appointment is theirs). |
| POST | `/dentists` | staff | `{ firstName, lastName, specialization, email?, phone?, bio?, workingDays, startTime, endTime, isActive? }` → 201. `workingDays` is de-duplicated and sorted. |
| PUT | `/dentists/:id` | staff | partial update (422 if resulting `endTime` ≤ `startTime`) |
| DELETE | `/dentists/:id` | staff | 400 if the dentist has upcoming active appointments |

### Appointments — `/api/appointments`

| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/appointments` | auth | Query: `page, limit, search, status, dentist, from, to, upcoming=true\|false, sort`. **Patient** → only their own; `search` matches dentist name/specialization and service name. **Staff** → all; `search` matches patient name/email, dentist name, service name. `upcoming=true` → `pending`/`confirmed` and not yet ended; `upcoming=false` → everything else (terminal status, or already ended). Default sort: `date` desc, `startTime` desc (for `upcoming=true`: ascending). |
| GET | `/appointments/:id` | owner patient or staff | 403 if not owner |
| POST | `/appointments` | patient or staff | Patient: `{ dentist, service, date, startTime, reason? }` (patient = self; `patient`/`status` in the body are ignored). Staff: same + required `patient` id (404 if not a patient, 400 if deactivated). Created with `status: "pending"` (staff may pass `status: "confirmed"`). → 201 populated appointment |
| PUT | `/appointments/:id` | owner patient / staff | Reschedule/edit: `{ dentist?, service?, date?, startTime?, reason? }`. Patient only while `pending`/`confirmed` and ≥ 24 h before current start; rescheduling resets status to `pending` (editing only `reason` does not). Staff: any non-terminal appointment. Booking rules are re-checked whenever dentist/service/date/startTime change. |
| PATCH | `/appointments/:id/status` | owner patient / staff | `{ status, cancellationReason? }` — see transition table. 400 for an invalid transition or the same status. |
| PUT | `/appointments/:id/treatment` | staff | `{ diagnosis, procedure, notes?, prescription?, followUpDate? }` — only when `status = completed`. Replaces any existing treatment; server sets `recordedBy`/`recordedAt`. |
| DELETE | `/appointments/:id` | staff | Hard delete. 200 `{ message }` |

### Patients (staff management) — `/api/patients` (staff only)

| Method | Path | Notes |
|---|---|---|
| GET | `/patients` | `search` (name/email/phone), `isActive=true\|false`, `page`, `limit`, `sort`. Always paginated. Each item includes `appointmentCount`. |
| GET | `/patients/:id` | `{ patient, appointments: [...] }` (all appointments, newest first) |
| POST | `/patients` | `{ firstName, lastName, email, password, phone?, dateOfBirth?, gender?, address?, medicalNotes? }` → 201 (walk-in registration) |
| PUT | `/patients/:id` | profile fields (incl. `email`, 409 if taken) + `isActive`; optional `password` to reset |
| DELETE | `/patients/:id` | Deletes patient **and** their appointments. 200 `{ message }` |

### Staff accounts — `/api/staff` (staff only)

| Method | Path | Notes |
|---|---|---|
| GET | `/staff` | `search` (name/email), `isActive`, `page`, `limit`, `sort`. Always paginated. |
| POST | `/staff` | `{ firstName, lastName, email, password, phone? }` → 201 (role forced to `staff`) |
| PUT | `/staff/:id` | `{ firstName?, lastName?, phone?, isActive?, password? }`. Cannot deactivate self (400). |
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
`upcoming` uses the same definition as `upcoming=true` above; `nextAppointment` is the earliest upcoming one. `recentAppointments` includes all statuses.

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
`totals.patients` = all patient accounts; `dentists`/`services` = active ones; `pending` = `statusCounts.pending`. `statusCounts` covers all appointments (all dates). **Cancelled** appointments are excluded from `todaySchedule` (so `appointmentsToday = todaySchedule.length`), `trend` and `topServices`.

---

## 5. Seeded accounts (`npm run seed`)

| Role | Email | Password |
|---|---|---|
| Staff (admin) | `SEED_ADMIN_EMAIL` (default `admin@smilecare.com`) | `SEED_ADMIN_PASSWORD` from `server/.env` |
| Staff | `staff@smilecare.com` | `Staff@12345` |
| Patients | `patient1@smilecare.com` … `patient8@smilecare.com` | `Patient@123` |
