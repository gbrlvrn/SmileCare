import { useState, useEffect, useMemo, useCallback } from 'react';
import { Dropdown, Badge } from 'react-bootstrap';
import {
  Bell,
  BellFill,
  CalendarCheck,
  CheckCircleFill,
  ClockFill,
  InfoCircleFill,
  JournalCheck,
  XCircleFill,
  Check2All,
} from 'react-bootstrap-icons';
import { useNavigate } from 'react-router-dom';
import { getAppointments } from '../api/appointmentApi';
import useAuth from '../hooks/useAuth';
import { formatDate, formatTimeRange, fullName } from '../utils/formatters';

const STORAGE_PREFIX = 'sc_read_notifications_';

export default function NotificationDropdown() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'
  const [isOpen, setIsOpen] = useState(false);

  // Read state stored in localStorage per user
  const storageKey = `${STORAGE_PREFIX}${user?._id || 'guest'}`;
  const [readIds, setReadIds] = useState(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Save readIds to localStorage
  const persistReadIds = (newReadIds) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(Array.from(newReadIds)));
    } catch {
      // ignore storage errors
    }
  };

  // Fetch appointments to generate notifications
  const fetchNotificationData = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await getAppointments({ limit: 15, sort: '-createdAt' });
      setAppointments(res?.data || []);
    } catch {
      // silently fallback to empty list
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotificationData();
  }, [fetchNotificationData]);

  // Refetch when dropdown opens
  const handleToggle = (nextOpen) => {
    setIsOpen(nextOpen);
    if (nextOpen) {
      fetchNotificationData();
    }
  };

  // Generate notifications based on role and appointments
  const notifications = useMemo(() => {
    const isStaff = user?.role === 'staff';
    const list = [];

    // System welcome notification
    list.push({
      id: `welcome-${user?._id}`,
      type: 'welcome',
      title: 'Welcome to SmileCare!',
      message: isStaff
        ? 'Manage clinic appointments, patient charts, and schedules seamlessly.'
        : 'Take control of your oral health. Book visits, track treatments, and view dental records.',
      time: 'Account active',
      icon: InfoCircleFill,
      iconVariant: 'primary',
      link: isStaff ? '/staff' : '/patient',
      createdAt: user?.createdAt ? new Date(user.createdAt).getTime() : 0,
    });

    appointments.forEach((appt) => {
      const serviceName = appt.services?.length
        ? appt.services.map((s) => s.name).join(', ')
        : (appt.service?.name || 'Dental service');

      const dentistName = appt.dentist
        ? (appt.dentist.fullName || `Dr. ${appt.dentist.firstName} ${appt.dentist.lastName}`)
        : 'Attending dentist';

      const patientName = appt.patient ? fullName(appt.patient) : 'Patient';
      const dateStr = formatDate(appt.date);
      const timeStr = appt.startTime ? `${appt.startTime}` : '';

      const baseLink = isStaff
        ? `/staff/appointments/${appt._id}`
        : `/patient/appointments/${appt._id}`;

      if (isStaff) {
        if (appt.status === 'pending') {
          list.push({
            id: `appt-${appt._id}-pending`,
            type: 'pending',
            title: 'New Booking Request',
            message: `${patientName} requested an appointment for ${serviceName} on ${dateStr} (${timeStr}).`,
            time: `${dateStr}`,
            icon: ClockFill,
            iconVariant: 'warning',
            link: baseLink,
            createdAt: new Date(appt.createdAt || appt.date).getTime(),
          });
        } else if (appt.status === 'confirmed') {
          list.push({
            id: `appt-${appt._id}-confirmed`,
            type: 'confirmed',
            title: 'Confirmed Visit',
            message: `${patientName} scheduled with ${dentistName} for ${serviceName} on ${dateStr}.`,
            time: `${dateStr}`,
            icon: CheckCircleFill,
            iconVariant: 'success',
            link: baseLink,
            createdAt: new Date(appt.createdAt || appt.date).getTime(),
          });
        } else if (appt.status === 'cancelled') {
          list.push({
            id: `appt-${appt._id}-cancelled`,
            type: 'cancelled',
            title: 'Appointment Cancelled',
            message: `Appointment for ${patientName} (${serviceName}) on ${dateStr} was cancelled.`,
            time: `${dateStr}`,
            icon: XCircleFill,
            iconVariant: 'danger',
            link: baseLink,
            createdAt: new Date(appt.updatedAt || appt.createdAt || appt.date).getTime(),
          });
        } else if (appt.status === 'completed') {
          list.push({
            id: `appt-${appt._id}-completed`,
            type: 'completed',
            title: 'Visit Completed',
            message: `Treatment completed for ${patientName} (${serviceName}).`,
            time: `${dateStr}`,
            icon: JournalCheck,
            iconVariant: 'info',
            link: baseLink,
            createdAt: new Date(appt.updatedAt || appt.createdAt || appt.date).getTime(),
          });
        }
      } else {
        // Patient notifications
        if (appt.status === 'confirmed') {
          list.push({
            id: `appt-${appt._id}-confirmed`,
            type: 'confirmed',
            title: 'Appointment Confirmed',
            message: `Your appointment for ${serviceName} with ${dentistName} on ${dateStr} at ${timeStr} is confirmed.`,
            time: `${dateStr} · ${timeStr}`,
            icon: CheckCircleFill,
            iconVariant: 'success',
            link: baseLink,
            createdAt: new Date(appt.createdAt || appt.date).getTime(),
          });
        } else if (appt.status === 'pending') {
          list.push({
            id: `appt-${appt._id}-pending`,
            type: 'pending',
            title: 'Booking Request Received',
            message: `Your booking for ${serviceName} on ${dateStr} at ${timeStr} is awaiting clinic confirmation.`,
            time: `${dateStr}`,
            icon: ClockFill,
            iconVariant: 'warning',
            link: baseLink,
            createdAt: new Date(appt.createdAt || appt.date).getTime(),
          });
        } else if (appt.status === 'completed') {
          list.push({
            id: `appt-${appt._id}-completed`,
            type: 'completed',
            title: 'Treatment Completed',
            message: `Your treatment notes for ${serviceName} have been recorded. You can view clinical details anytime.`,
            time: `${dateStr}`,
            icon: JournalCheck,
            iconVariant: 'info',
            link: baseLink,
            createdAt: new Date(appt.updatedAt || appt.createdAt || appt.date).getTime(),
          });
        } else if (appt.status === 'cancelled') {
          list.push({
            id: `appt-${appt._id}-cancelled`,
            type: 'cancelled',
            title: 'Appointment Cancelled',
            message: `Your appointment for ${serviceName} on ${dateStr} was cancelled.`,
            time: `${dateStr}`,
            icon: XCircleFill,
            iconVariant: 'danger',
            link: baseLink,
            createdAt: new Date(appt.updatedAt || appt.createdAt || appt.date).getTime(),
          });
        }
      }
    });

    // Sort by recent first
    return list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [user, appointments]);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !readIds.has(n.id)).length;
  }, [notifications, readIds]);

  const displayedNotifications = useMemo(() => {
    if (filter === 'unread') {
      return notifications.filter((n) => !readIds.has(n.id));
    }
    return notifications;
  }, [notifications, filter, readIds]);

  const markAsRead = (id) => {
    if (readIds.has(id)) return;
    const next = new Set(readIds);
    next.add(id);
    setReadIds(next);
    persistReadIds(next);
  };

  const markAllAsRead = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    const next = new Set(readIds);
    notifications.forEach((n) => next.add(n.id));
    setReadIds(next);
    persistReadIds(next);
  };

  const handleNotificationClick = (item) => {
    markAsRead(item.id);
    setIsOpen(false);
    if (item.link) {
      navigate(item.link);
    }
  };

  const allAppointmentsPath = user?.role === 'staff' ? '/staff/appointments' : '/patient/appointments';

  return (
    <Dropdown align="end" show={isOpen} onToggle={handleToggle} className="sc-notification-dropdown">
      <Dropdown.Toggle
        as="button"
        type="button"
        className="btn sc-icon-btn position-relative sc-notification-toggle"
        id="notification-dropdown-toggle"
        aria-label={`Notifications (${unreadCount} unread)`}
      >
        {unreadCount > 0 ? (
          <BellFill size={19} className="sc-bell-icon text-primary" />
        ) : (
          <Bell size={19} className="sc-bell-icon" />
        )}

        {unreadCount > 0 && (
          <span className="position-absolute sc-notification-badge badge rounded-pill bg-danger">
            {unreadCount > 9 ? '9+' : unreadCount}
            <span className="visually-hidden">unread notifications</span>
          </span>
        )}
      </Dropdown.Toggle>

      <Dropdown.Menu className="sc-notification-menu shadow-lg border-0 py-0">
        {/* Header */}
        <div className="sc-notification-header d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-2">
            <span className="sc-notification-header-title">Notifications</span>
            {unreadCount > 0 && (
              <Badge bg="primary-subtle" className="text-primary rounded-pill px-2" style={{ fontSize: '0.72rem' }}>
                {unreadCount} new
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              type="button"
              className="sc-notification-mark-all d-flex align-items-center gap-1"
              onClick={markAllAsRead}
              title="Mark all notifications as read"
            >
              <Check2All size={14} />
              <span>Mark all read</span>
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="sc-notification-tabs">
          <button
            type="button"
            className={`sc-notification-tab-btn ${filter === 'all' ? 'is-active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({notifications.length})
          </button>
          <button
            type="button"
            className={`sc-notification-tab-btn ${filter === 'unread' ? 'is-active' : ''}`}
            onClick={() => setFilter('unread')}
          >
            Unread ({unreadCount})
          </button>
        </div>

        {/* Notification List */}
        <div className="sc-notification-list">
          {displayedNotifications.length === 0 ? (
            <div className="text-center py-4 px-3 text-muted">
              <div className="sc-notification-empty-icon mb-2">
                <Bell size={26} className="text-secondary opacity-50" />
              </div>
              <div className="fw-semibold small text-dark">
                {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
              </div>
              <p className="small mb-0 text-muted" style={{ fontSize: '0.78rem' }}>
                {filter === 'unread'
                  ? "You've caught up with all your updates."
                  : 'Updates regarding your appointments will appear here.'}
              </p>
            </div>
          ) : (
            displayedNotifications.map((item) => {
              const isUnread = !readIds.has(item.id);
              const IconComponent = item.icon || CalendarCheck;
              return (
                <div
                  key={item.id}
                  className={`sc-notification-item ${isUnread ? 'is-unread' : ''}`}
                  onClick={() => handleNotificationClick(item)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleNotificationClick(item);
                    }
                  }}
                >
                  <div
                    className={`sc-notification-icon-wrap bg-${item.iconVariant || 'primary'}-subtle text-${item.iconVariant || 'primary'}`}
                  >
                    <IconComponent size={16} />
                  </div>

                  <div className="sc-notification-content">
                    <div className="sc-notification-title-row">
                      <span className="sc-notification-title">
                        {item.title}
                      </span>
                      {isUnread && <span className="sc-notification-unread-dot" title="Unread" />}
                    </div>
                    <p className="sc-notification-desc">
                      {item.message}
                    </p>
                    <div className="sc-notification-time">
                      {item.time}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="sc-notification-footer">
          <button
            type="button"
            className="btn btn-link btn-sm p-0 text-decoration-none small text-primary fw-semibold"
            onClick={() => {
              setIsOpen(false);
              navigate(allAppointmentsPath);
            }}
          >
            View all appointments &rarr;
          </button>
        </div>
      </Dropdown.Menu>
    </Dropdown>
  );
}
