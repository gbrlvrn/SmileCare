import { Alert, Button, Col, Form, Row, Spinner } from 'react-bootstrap';
import { Envelope, Calendar3, Telephone } from 'react-bootstrap-icons';
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
      <PageHeader title="My profile" subtitle="Manage your personal information and password." />

      <Row className="g-4">
        {/* Summary card */}
        <Col lg={4}>
          <div className="sc-card sc-profile-summary">
            <div className="sc-avatar sc-avatar-lg" aria-hidden="true">
              {initials(name)}
            </div>
            <h2 className="h5 fw-semibold mt-3 mb-1">{name}</h2>
            <span className="badge rounded-pill sc-badge sc-badge-primary">
              {ROLE_LABELS[user?.role]}
            </span>
            <ul className="sc-profile-facts">
              <li>
                <Envelope aria-hidden="true" />
                <span className="text-break">{user?.email}</span>
              </li>
              <li>
                <Telephone aria-hidden="true" />
                <span>{user?.phone || 'No phone number'}</span>
              </li>
              <li>
                <Calendar3 aria-hidden="true" />
                <span>Member since {formatDate(user?.createdAt)}</span>
              </li>
            </ul>
          </div>
        </Col>

        <Col lg={8} className="d-flex flex-column gap-4">
          {/* Profile details */}
          <section className="sc-card" aria-labelledby="profile-details-title">
            <h2 id="profile-details-title" className="sc-card-title">
              Personal details
            </h2>
            {profileForm.serverError && (
              <Alert variant="danger" className="small">
                {profileForm.serverError}
              </Alert>
            )}
            <Form noValidate onSubmit={profileForm.handleSubmit}>
              <Row className="g-3">
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
                    helpText="Email cannot be changed."
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
                      label="Medical notes"
                      as="textarea"
                      rows={3}
                      maxLength={500}
                      showCount
                      placeholder="Allergies, medications or conditions your dentist should know about"
                      groupClassName=""
                      {...profileForm.field('medicalNotes')}
                    />
                  </Col>
                )}
              </Row>
              <div className="d-flex justify-content-end gap-2 mt-4">
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

          {/* Change password */}
          <section className="sc-card" aria-labelledby="change-password-title">
            <h2 id="change-password-title" className="sc-card-title">
              Change password
            </h2>
            {passwordForm.serverError && (
              <Alert variant="danger" className="small">
                {passwordForm.serverError}
              </Alert>
            )}
            <Form noValidate onSubmit={passwordForm.handleSubmit}>
              <Row className="g-3">
                <Col xs={12}>
                  <PasswordInput label="Current password" autoComplete="current-password" required groupClassName="" {...passwordForm.field('currentPassword')} />
                </Col>
                <Col sm={6}>
                  <PasswordInput
                    label="New password"
                    autoComplete="new-password"
                    required
                    groupClassName=""
                    aria-describedby="new-password-rules"
                    {...passwordForm.field('newPassword')}
                  />
                </Col>
                <Col sm={6}>
                  <PasswordInput label="Confirm new password" autoComplete="new-password" required groupClassName="" {...passwordForm.field('confirmPassword')} />
                </Col>
                <Col xs={12}>
                  <PasswordChecklist id="new-password-rules" password={passwordForm.values.newPassword} />
                </Col>
              </Row>
              <div className="d-flex justify-content-end mt-3">
                <Button type="submit" disabled={passwordForm.submitting}>
                  {passwordForm.submitting && (
                    <Spinner size="sm" animation="border" className="me-2" aria-hidden="true" />
                  )}
                  Update password
                </Button>
              </div>
            </Form>
          </section>
        </Col>
      </Row>
    </>
  );
}
