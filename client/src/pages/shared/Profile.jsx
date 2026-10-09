import { Alert, Button, Col, Form, Row, Spinner } from 'react-bootstrap';
import {
  Envelope,
  Calendar3,
  Telephone,
  Person,
  PersonGear,
  ShieldLock,
  ShieldCheck,
  CheckCircleFill,
} from 'react-bootstrap-icons';
import { getErrorMessage } from '../../api/errors';
import { changePassword, updateProfile } from '../../api/userApi';
import FormInput from '../../components/FormInput';
import PageHeader from '../../components/PageHeader';
import PasswordChecklist from '../../components/PasswordChecklist';
import PasswordInput from '../../components/PasswordInput';
import useAuth from '../../hooks/useAuth';
import useForm from '../../hooks/useForm';
import useToast from '../../hooks/useToast';
import { GENDERS, ROLE_LABELS } from '../../utils/constants';
import { formatDate, fullName, initials, todayISO, toInputDate } from '../../utils/formatters';
import { validatePasswordChange, validateProfile } from '../../utils/validators';

/** Turns the user object into form values (all strings for controlled inputs). */
function toFormValues(user) {
  return {
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    dateOfBirth: toInputDate(user?.dateOfBirth),
    gender: user?.gender || '',
    address: user?.address || '',
    medicalNotes: user?.medicalNotes || '',
  };
}

/** Only sends fields that actually changed (trimmed). */
function getChangedFields(values, original, isPatient) {
  const payload = {};
  Object.entries(values).forEach(([key, value]) => {
    if (key === 'medicalNotes' && !isPatient) return;
    const next = typeof value === 'string' ? value.trim() : value;
    if (next !== original[key]) payload[key] = next;
  });
  return payload;
}

const PASSWORD_INITIAL = { currentPassword: '', newPassword: '', confirmPassword: '' };

/** Profile page shared by patients and staff: edit details + change password. */
export default function Profile() {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();
  const isPatient = user?.role === 'patient';
  const name = fullName(user);

  // ----- Profile details form -----
  const profileForm = useForm({
    initialValues: toFormValues(user),
    validate: (values) => validateProfile(values, user?.role),
    onSubmit: async (values, { reset }) => {
      const payload = getChangedFields(values, toFormValues(user), isPatient);
      if (Object.keys(payload).length === 0) {
        showToast({ type: 'info', message: 'There are no changes to save.' });
        return;
      }
      const res = await updateProfile(payload);
      updateUser(res.data);
      reset(toFormValues(res.data));
      showToast({ type: 'success', message: 'Your profile has been updated.' });
    },
  });

  // ----- Change password form -----
  const passwordForm = useForm({
    initialValues: PASSWORD_INITIAL,
    validate: validatePasswordChange,
    onSubmit: async (values, { reset, setFieldErrors }) => {
      try {
        await changePassword(values);
        reset();
        showToast({ type: 'success', message: 'Your password has been changed.' });
      } catch (err) {
        // 400 = current password is wrong → show it under that field
        if (err.response?.status === 400) {
          setFieldErrors({ currentPassword: getErrorMessage(err) });
          return;
        }
        throw err; // anything else is handled by useForm (422 field errors / alert)
      }
    },
  });

  return (
    <>
      <PageHeader
        title="My profile"
        subtitle="Manage your personal information, contact preferences, and account security."
      />

      {/* Profile Overview Hero Banner */}
      <div className="sc-card sc-profile-hero mb-4 p-4">
        <div className="d-flex flex-column flex-md-row align-items-center align-items-md-start gap-4">
          <div className="sc-profile-hero-avatar-wrap">
            <div className="sc-avatar sc-avatar-xl shadow-sm" aria-hidden="true">
              {initials(name)}
            </div>
            <span className="sc-profile-status-indicator" title="Active Account" />
          </div>

          <div className="flex-grow-1 text-center text-md-start">
            <div className="d-flex flex-column flex-md-row align-items-center align-items-md-center gap-2 mb-2">
              <h2 className="h4 fw-bold text-dark mb-0">{name}</h2>
              <span className="badge rounded-pill bg-primary-subtle text-primary px-3 py-1 fw-semibold">
                {ROLE_LABELS[user?.role] || 'Member'}
              </span>
              <span
                className="badge rounded-pill bg-success-subtle text-success px-3 py-1 small fw-semibold d-inline-flex align-items-center"
                style={{ gap: '0.35rem' }}
              >
                <CheckCircleFill size={12} />
                <span>Active Account</span>
              </span>
            </div>

            <div className="sc-profile-hero-meta">
              <div className="sc-profile-meta-item">
                <Envelope size={15} />
                <span>{user?.email}</span>
              </div>
              <span className="sc-profile-meta-dot d-none d-md-inline">&bull;</span>
              <div className="sc-profile-meta-item">
                <Telephone size={15} />
                <span>{user?.phone || 'No mobile added'}</span>
              </div>
              <span className="sc-profile-meta-dot d-none d-md-inline">&bull;</span>
              <div className="sc-profile-meta-item">
                <Calendar3 size={15} />
                <span>Member since {formatDate(user?.createdAt)}</span>
              </div>
              {user?.gender && (
                <>
                  <span className="sc-profile-meta-dot d-none d-md-inline">&bull;</span>
                  <div className="sc-profile-meta-item text-capitalize">
                    <Person size={15} />
                    <span>{user.gender}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <Row className="g-4">
        {/* Left Column: Personal details */}
        <Col lg={7}>
          <section className="sc-card p-4 h-100 d-flex flex-column" aria-labelledby="profile-details-title">
            <div className="sc-profile-card-header">
              <div className="sc-profile-card-icon">
                <PersonGear size={20} />
              </div>
              <div>
                <h3 id="profile-details-title" className="h5 fw-bold mb-0 text-dark">
                  Personal Information
                </h3>
                <p className="text-muted small mb-0">Update your personal details and contact preferences</p>
              </div>
            </div>

            {profileForm.serverError && (
              <Alert variant="danger" className="small">
                {profileForm.serverError}
              </Alert>
            )}

            <Form noValidate onSubmit={profileForm.handleSubmit} className="d-flex flex-column flex-grow-1">
              <Row className="g-3 flex-grow-1">
                <Col sm={6}>
                  <FormInput label="First name" autoComplete="given-name" required groupClassName="" {...profileForm.field('firstName')} />
                </Col>
                <Col sm={6}>
                  <FormInput label="Last name" autoComplete="family-name" required groupClassName="" {...profileForm.field('lastName')} />
                </Col>
                <Col sm={6}>
                  <FormInput
                    label="Email address"
                    name="email"
                    type="email"
                    value={user?.email || ''}
                    disabled
                    readOnly
                    helpText="Email is managed by clinic staff."
                    groupClassName=""
                  />
                </Col>
                <Col sm={6}>
                  <FormInput label="Mobile number" type="tel" autoComplete="tel" placeholder="09XXXXXXXXX" groupClassName="" {...profileForm.field('phone')} />
                </Col>
                <Col sm={6}>
                  <FormInput label="Date of birth" type="date" max={todayISO()} groupClassName="" {...profileForm.field('dateOfBirth')} />
                </Col>
                <Col sm={6}>
                  <FormInput label="Gender" as="select" placeholder="Not specified" options={GENDERS} groupClassName="" {...profileForm.field('gender')} />
                </Col>
                <Col xs={12}>
                  <FormInput label="Address" autoComplete="street-address" maxLength={200} groupClassName="" {...profileForm.field('address')} />
                </Col>
                {isPatient && (
                  <Col xs={12}>
                    <FormInput
                      label="Medical notes & health conditions"
                      as="textarea"
                      rows={3}
                      maxLength={500}
                      showCount
                      placeholder="Allergies, current medications, or pre-existing oral health conditions your dentist should know about"
                      groupClassName=""
                      {...profileForm.field('medicalNotes')}
                    />
                  </Col>
                )}
              </Row>

              <div className="d-flex justify-content-end gap-2 pt-3 mt-3 border-top">
                <Button
                  variant="light"
                  type="button"
                  onClick={() => profileForm.reset(toFormValues(user))}
                  disabled={profileForm.submitting}
                >
                  Reset
                </Button>
                <Button type="submit" disabled={profileForm.submitting}>
                  {profileForm.submitting && (
                    <Spinner size="sm" animation="border" className="me-2" aria-hidden="true" />
                  )}
                  Save changes
                </Button>
              </div>
            </Form>
          </section>
        </Col>

        {/* Right Column: Security / Change password */}
        <Col lg={5} className="d-flex flex-column gap-4">
          <section className="sc-card p-4" aria-labelledby="change-password-title">
            <div className="sc-profile-card-header">
              <div className="sc-profile-card-icon">
                <ShieldLock size={20} />
              </div>
              <div>
                <h3 id="change-password-title" className="h5 fw-bold mb-0 text-dark">
                  Security & Password
                </h3>
                <p className="text-muted small mb-0">Ensure your account is protected with a strong password</p>
              </div>
            </div>

            {passwordForm.serverError && (
              <Alert variant="danger" className="small">
                {passwordForm.serverError}
              </Alert>
            )}

            <Form noValidate onSubmit={passwordForm.handleSubmit}>
              <div className="d-flex flex-column gap-3">
                <PasswordInput
                  label="Current password"
                  autoComplete="current-password"
                  required
                  groupClassName=""
                  {...passwordForm.field('currentPassword')}
                />
                <PasswordInput
                  label="New password"
                  autoComplete="new-password"
                  required
                  groupClassName=""
                  aria-describedby="new-password-rules"
                  {...passwordForm.field('newPassword')}
                />
                <PasswordInput
                  label="Confirm new password"
                  autoComplete="new-password"
                  required
                  groupClassName=""
                  {...passwordForm.field('confirmPassword')}
                />
                <PasswordChecklist
                  id="new-password-rules"
                  password={passwordForm.values.newPassword}
                  confirmPassword={passwordForm.values.confirmPassword}
                />
              </div>

              <div className="d-flex justify-content-end pt-3 mt-3 border-top">
                <Button type="submit" disabled={passwordForm.submitting} className="w-100 w-sm-auto">
                  {passwordForm.submitting && (
                    <Spinner size="sm" animation="border" className="me-2" aria-hidden="true" />
                  )}
                  Update password
                </Button>
              </div>
            </Form>
          </section>

          {/* Account Security & Privacy Tip */}
          <div className="sc-profile-tip-card d-flex align-items-start gap-3">
            <ShieldCheck className="text-primary flex-shrink-0 mt-0.5" size={22} />
            <div className="small">
              <div className="fw-semibold text-dark mb-1">Account & Privacy Protection</div>
              <p className="text-muted mb-0 lh-base">
                Your medical and personal information is encrypted according to healthcare confidentiality standards.
                To change your registered email, please coordinate with our clinic reception directly.
              </p>
            </div>
          </div>
        </Col>
      </Row>
    </>
  );
}
