# SmileCare — Dental Clinic Online Appointment System

A full-stack **MERN** (MongoDB, Express.js, React.js, Node.js) web application for booking and managing dental appointments, built as the final project for *Advanced Web Programming*.

- **Patients** register, book appointments via a step-by-step wizard, reschedule/cancel, and view their treatment history.
- **Staff** manage appointments, patients, dentists, services and staff accounts from a responsive dashboard with analytics.

> Full documentation (setup, features, screenshots) is completed at the end of the build.

## Tech stack
| Layer | Tech |
|---|---|
| Frontend | React, React Router, React Hooks, Axios, React-Bootstrap |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas (Mongoose) |
| Auth | JSON Web Token (JWT), bcrypt |

## Project structure
```
client/   React app (Vite)
server/   Express REST API
docs/     API contract & security notes
design/   UI design references
```

## Quick start
```bash
# 1. API
cd server
cp .env.example .env      # fill in MONGODB_URI, JWT_SECRET, SEED_ADMIN_PASSWORD
npm install
npm run seed              # optional demo data
npm run dev               # http://localhost:5000

# 2. Client
cd ../client
cp .env.example .env
npm install
npm run dev               # http://localhost:5173
```
