# SmileCare — Client (React + Vite)

Front-end of the SmileCare dental clinic appointment system.

**Stack:** React 19 · Vite · React Router (component API) · Axios · Bootstrap 5.3 + React-Bootstrap · react-bootstrap-icons · Recharts. Plain JavaScript (JSX), function components and hooks only.

## Getting started

```bash
cd client
npm install
cp .env.example .env      # VITE_API_URL=http://localhost:5000/api
npm run dev               # http://localhost:5173
```

| Script | What it does |
|---|---|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Lint with oxlint |

## Folder structure

```
src/
├─ api/          axios instance (Bearer token + 401 handling) and one file per resource
├─ assets/       images
├─ components/   reusable UI (Sidebar, Topbar, StatCard, Pagination, FormInput, …)
├─ context/      AuthProvider (session) and ToastProvider (notifications)
├─ hooks/        useAuth, useToast, useFetch, useListQuery, useForm, useDebounce, useDocumentTitle
├─ layouts/      PublicLayout, AuthLayout (split screen), DashboardLayout (sidebar + top bar)
├─ pages/        public/, patient/, staff/, shared/Profile
├─ routes/       ProtectedRoute, RoleRoute, GuestRoute
├─ styles/       theme.css: Bootstrap CSS-variable overrides and sc-* classes
└─ utils/        constants, formatters (timezone-safe dates, PHP currency), validators
```

## Key ideas

- **Auth:** the JWT is stored in `localStorage` (`smilecare_token`). On refresh, `AuthProvider` calls `GET /auth/me` to restore the user. A 401 from any API call clears the session and redirects to `/login?session=expired`.
- **Routing:** route guards are layout routes. `ProtectedRoute` requires login, `RoleRoute` checks the role, and `GuestRoute` keeps logged-in users away from login/register.
- **Forms:** controlled inputs via the `useForm` hook. Validation lives in `utils/validators.js`, runs on submit and then live after blur. Server `422` field errors are shown under the matching inputs.
- **Lists:** `useListQuery` handles server-side pagination, the debounced search (400 ms) and filters.
- **Theme:** one plain CSS file (`styles/theme.css`) overrides Bootstrap's CSS variables. No Sass build step.

## Deployment (Vercel)

Root directory `client`, build command `npm run build`, output `dist`. Set `VITE_API_URL` to the deployed API URL. `vercel.json` rewrites every route to `index.html` so deep links work.
