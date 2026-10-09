# SmileCare — Security Measures

This document lists every security measure in the SmileCare API: **what** it does, **where** it is in the code, and **why** it is there. Paths are relative to `server/`.

## Request pipeline

Every request goes through the middleware in this order (`src/app.js`):

```
helmet → cors → express.json(10kb) → mongoSanitize → (morgan, dev only) → apiLimiter
  → route: [authLimiter] → protect → authorize(role) → validators → validate → controller
  → notFound → errorHandler
```

## 1. Authentication & passwords

| Measure | Where | Why |
|---|---|---|
| **bcrypt hashing (12 salt rounds)** | `src/models/User.js` (`pre('save')` hook, `comparePassword`) | Passwords are never stored in plain text. bcrypt is slow on purpose and salted, so leaked hashes are hard to crack. The hook runs on every save, so register, staff-created accounts, password changes and resets are all hashed. |
| **Password never returned** | `src/models/User.js` (`select: false` + `toJSON` transform) | The hash is excluded from every query unless explicitly requested with `.select('+password')`, and is stripped again when serialising (defence in depth). |
| **Password policy** | `src/validators/common.js` (`passwordRule`) | 8–64 characters with uppercase, lowercase and a digit. Checked on the server, because the client can be bypassed. |
| **JWT (stateless sessions)** | `src/utils/generateToken.js` | Signed with `JWT_SECRET` (64 random bytes), expires after `JWT_EXPIRES_IN` (1 day). The payload contains only `{ id, role }`, so no personal data. |
| **Generic login error** | `src/controllers/auth.controller.js` (`login`) | Unknown email and wrong password both return `401 "Invalid email or password"`, so attackers cannot find out which emails are registered. |
| **Change password requires current password** | `src/controllers/user.controller.js` (`changePassword`) | A stolen, still-valid token alone is not enough to take over the account permanently. Clears failed attempts counter. |
| **5-Attempt Account Lockout (60s timer)** | `src/models/User.js`, `src/controllers/auth.controller.js` (`login`) | After 5 consecutive failed passwords, the account is temporarily locked for 60 seconds (HTTP 423 Locked) with live timer countdown. Successful login resets the counter. |

## 2. Authorization

| Measure | Where | Why |
|---|---|---|
| **`protect` middleware** | `src/middleware/auth.js` | Reads `Authorization: Bearer <token>`, verifies the signature and expiry, loads the user from the DB and rejects missing, deleted or **deactivated** users (401). Deactivating an account therefore takes effect immediately, even if the token has not expired. |
| **`authorize(...roles)`** | `src/middleware/auth.js`, used in `src/routes/*.routes.js` | Role-based access control: staff-only routes (patients, staff accounts, CRUD on services/dentists, treatment notes, staff dashboard) return **403** for patients. |
| **IDOR protection (ownership checks)** | `src/controllers/appointment.controller.js` (`findAccessibleAppointment`, `listAppointments`), `src/controllers/dashboard.controller.js` | Patient queries are always filtered by `patient: req.user._id` on the server. On `/:id` routes, a patient accessing someone else's appointment gets **403**. The patient id is never taken from the request body for patients. |
| **Role forcing / privilege escalation** | `src/controllers/auth.controller.js` (`register`), `src/controllers/staff.controller.js` (`createStaff`) | Public registration always creates `role: 'patient'`, even if the body contains `role: 'staff'`. Only staff can create staff accounts. |
| **Field whitelisting (mass-assignment protection)** | `src/utils/response.js` (`pick`), used by every controller | Only explicitly allowed fields are copied from `req.body`. `PUT /users/me` can never change `role`, `email`, `isActive` or `password`. |
| **Self-protection for staff** | `src/controllers/staff.controller.js` | Staff cannot deactivate or delete their own account (400), so the clinic cannot lock itself out by accident. |

## 3. Input validation & injection

| Measure | Where | Why |
|---|---|---|
| **express-validator on every route with input** | `src/validators/*.validators.js`, `src/middleware/validate.js` | Type, format and length checks (email, PH phone `^(09\|\+639)\d{9}$`, dates `YYYY-MM-DD`, times `HH:mm`, enums, ObjectIds). Failures return **422** with `errors: [{ field, message }]`. Type checks such as `isString()` also reject objects like `{ "$gt": "" }`. |
| **NoSQL injection: `express-mongo-sanitize`** | `src/app.js` | Removes keys that start with `$` or contain `.` from `req.body`, `req.query` and `req.params`, so operators like `$gt` / `$ne` cannot be injected into Mongo queries (e.g. the login bypass `{"email":{"$gt":""}}`). |
| **ObjectId validation** | `src/middleware/validate.js` (`validateObjectId`) | Invalid ids in the URL return 404 before reaching Mongoose, instead of causing cast errors. |
| **Regex escaping for search** | `src/utils/escapeRegex.js` | User search text is escaped before it is used in `$regex`, which prevents regex injection and ReDoS (catastrophic backtracking) patterns such as `(a+)+$`. Search length is limited to 100 characters. |
| **Sort whitelist** | `src/utils/pagination.js` (`parseSort`) | Only known fields can be used in `?sort=`. |
| **Pagination cap** | `src/utils/pagination.js` | `limit` is capped at 50, so a client cannot dump a whole collection in one request. |
| **XSS: tag stripping on input + escaping on output** | `src/validators/common.js` (`stripTags`, used by `textRule`), client (React) | Free-text fields (reason, notes, bio, description, medical notes, address, treatment fields) have HTML tags and control characters stripped on input (`<script>alert(1)</script>x` → `alert(1)x`). Text is stored as-is otherwise (no `&#x27;` entities), and React auto-escapes it when rendering. The client never uses `dangerouslySetInnerHTML`. Helmet's headers add another layer. Names, emails, specialization and service names use strict character whitelists. |
| **Business rules on the server** | `src/services/appointment.service.js` (`validateBooking`) | Booking in the past, on Sundays, outside a dentist's hours, or overlapping another booking is rejected server-side, even if the UI is bypassed. |
| **Double booking protection in the DB** | `src/models/Appointment.js` (unique partial index `{ dentist, date, startTime }` where `slotActive: true`) | Even if two requests arrive at the same moment, MongoDB rejects the second one (E11000 → 409). |

## 4. HTTP hardening

| Measure | Where | Why |
|---|---|---|
| **Helmet** | `src/app.js` | Sets secure HTTP headers: Content-Security-Policy, `X-Content-Type-Options: nosniff`, `X-Frame-Options` (clickjacking), HSTS, `Referrer-Policy`, and removes `X-Powered-By`. |
| **CORS whitelist** | `src/app.js` | Only origins listed in `CLIENT_URL` (comma-separated) may call the API from a browser. `credentials: false`, because the token is sent in a header, not a cookie. |
| **Body size limit (10 kb)** | `src/app.js` (`express.json({ limit: '10kb' })`) | Prevents memory exhaustion with huge payloads (returns 413). |
| **Rate limiting** | `src/middleware/rateLimiters.js` | `apiLimiter`: 300 requests / 15 min / IP on all `/api` routes. `authLimiter`: 10 requests / 15 min / IP for registration & OTP. `loginLimiter`: **5 attempts / 60 sec / IP** specifically for login, protecting against credential-stuffing and automated attacks. Returns 429 with standard error envelope and Retry-After. |
| **`trust proxy` in production** | `src/app.js` | On Render the app runs behind a proxy, so the real client IP comes from `X-Forwarded-For`. Without this, every user would share one rate-limit bucket. |

## 5. Error handling & information leakage

| Measure | Where | Why |
|---|---|---|
| **Central error handler** | `src/middleware/errorHandler.js` | Converts every error into `{ success: false, message, errors? }`. Mongoose cast errors → 404, duplicate keys → 409 with a friendly message, validation errors → 422, JWT errors → 401, malformed JSON → 400. |
| **No stack traces in production** | `src/middleware/errorHandler.js` | When `NODE_ENV=production`, unknown errors return only `"Server error"`. Internal details are logged on the server, not sent to the client. |
| **Request logging only in development** | `src/app.js` (`morgan('dev')`) | Avoids noisy logs in production. Secrets are never logged: `src/config/db.js` prints only the database name, never the connection string. |

## 6. Secrets & configuration

| Measure | Where | Why |
|---|---|---|
| **`.env` is git-ignored** | `.gitignore`, `server/.env` | The MongoDB URI, JWT secret and seed admin password never go into the public repository. |
| **`.env.example` committed** | `server/.env.example` | Documents the required variables with placeholders only. |
| **Startup check** | `src/server.js` | The API refuses to start if `MONGODB_URI` or `JWT_SECRET` is missing, instead of running with an undefined secret. |
| **Seed admin password from env** | `scripts/seed.js` | The admin password is read from `SEED_ADMIN_PASSWORD` and is never printed by the seed script. |

## Known trade-offs

- **JWT in `localStorage`** (client): simple and works well with `Authorization` headers, but readable by injected scripts. XSS risk is reduced by React's output escaping, server-side tag stripping and Helmet's CSP. An httpOnly cookie would also need CSRF protection.
- **Stateless logout**: the server cannot revoke a token before it expires (1 day). Deactivating a user does block them immediately, because `protect` checks `isActive` on every request.
- **In-memory rate-limit store**: counters reset when the server restarts and are not shared between instances. That is fine for a single Render instance; a Redis store would be needed to scale out.
