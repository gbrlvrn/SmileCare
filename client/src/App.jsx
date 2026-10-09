import { Navigate, Route, Routes } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import PublicLayout from './layouts/PublicLayout';
import GuestRoute from './routes/GuestRoute';
import ProtectedRoute from './routes/ProtectedRoute';
import RoleRoute from './routes/RoleRoute';

import Landing from './pages/public/Landing';
import NotFound from './pages/public/NotFound';
import Profile from './pages/shared/Profile';

import PatientAppointmentDetail from './pages/patient/AppointmentDetail';
import BookAppointment from './pages/patient/BookAppointment';
import PatientDashboard from './pages/patient/Dashboard';
import MyAppointments from './pages/patient/MyAppointments';
import TreatmentHistory from './pages/patient/TreatmentHistory';

import StaffAppointmentDetail from './pages/staff/AppointmentDetail';
import StaffAppointments from './pages/staff/Appointments';
import StaffDashboard from './pages/staff/Dashboard';
import Dentists from './pages/staff/Dentists';
import PatientDetail from './pages/staff/PatientDetail';
import Patients from './pages/staff/Patients';
import Services from './pages/staff/Services';
import StaffAccounts from './pages/staff/StaffAccounts';

/**
 * Route tree. Guards are "layout routes" that render <Outlet /> when access is allowed:
 *   ProtectedRoute → must be logged in
 *   RoleRoute      → must have one of the roles
 *   GuestRoute     → must NOT be logged in (login/register)
 */
export default function App() {
  return (
    <Routes>
      {/* Public website */}
      <Route element={<PublicLayout />}>
        <Route index element={<Landing />} />
      </Route>

      {/* Guests only: redirects to modal popup on home page */}
      <Route element={<GuestRoute />}>
        <Route path="login" element={<Navigate to="/?auth=login" replace />} />
        <Route path="register" element={<Navigate to="/?auth=register" replace />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        {/* Patient area */}
        <Route element={<RoleRoute roles={['patient']} />}>
          <Route path="patient" element={<DashboardLayout />}>
            <Route index element={<PatientDashboard />} />
            <Route path="book" element={<BookAppointment />} />
            <Route path="appointments" element={<MyAppointments />} />
            <Route path="appointments/:id" element={<PatientAppointmentDetail />} />
            <Route path="history" element={<TreatmentHistory />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Route>

        {/* Staff area */}
        <Route element={<RoleRoute roles={['staff']} />}>
          <Route path="staff" element={<DashboardLayout />}>
            <Route index element={<StaffDashboard />} />
            <Route path="appointments" element={<StaffAppointments />} />
            <Route path="appointments/:id" element={<StaffAppointmentDetail />} />
            <Route path="patients" element={<Patients />} />
            <Route path="patients/:id" element={<PatientDetail />} />
            <Route path="dentists" element={<Dentists />} />
            <Route path="services" element={<Services />} />
            <Route path="accounts" element={<StaffAccounts />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
