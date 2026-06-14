import { bookingApi } from './bookingApi';

const STATUS_MESSAGES = {
  learner: {
    pending: {
      title: 'Booking submitted',
      body: (name) => `Waiting for ${name} to confirm your session.`,
      icon: 'schedule',
      accent: 'gold',
    },
    confirmed: {
      title: 'Session confirmed',
      body: (name, date) => `${name} confirmed your session${date ? ` on ${date}` : ''}.`,
      icon: 'check-circle',
      accent: 'teal',
    },
    rejected: {
      title: 'Session declined',
      body: (name) => `${name} could not accept your session.`,
      icon: 'cancel',
      accent: 'error',
    },
    completed: {
      title: 'Session completed',
      body: (name) => `Your session with ${name} is complete. Leave a review!`,
      icon: 'school',
      accent: 'purple',
    },
    cancelled: {
      title: 'Session cancelled',
      body: (name) => `Your session with ${name} was cancelled.`,
      icon: 'event-busy',
      accent: 'error',
    },
  },
  mentor: {
    pending: {
      title: 'New booking request',
      body: (name, date) => `${name} requested a session${date ? ` on ${date}` : ''}.`,
      icon: 'event',
      accent: 'gold',
    },
    confirmed: {
      title: 'Session scheduled',
      body: (name, date) => `You confirmed a session with ${name}${date ? ` on ${date}` : ''}.`,
      icon: 'event-available',
      accent: 'teal',
    },
    completed: {
      title: 'Session completed',
      body: (name) => `Your session with ${name} is marked complete.`,
      icon: 'done-all',
      accent: 'purple',
    },
    cancelled: {
      title: 'Session cancelled',
      body: (name) => `${name}'s session was cancelled.`,
      icon: 'event-busy',
      accent: 'error',
    },
    rejected: {
      title: 'Session declined',
      body: (name) => `You declined ${name}'s booking request.`,
      icon: 'block',
      accent: 'muted',
    },
  },
};

function formatSlotDate(slot) {
  if (!slot?.date) return '';
  const d = new Date(`${slot.date}T12:00:00`);
  if (Number.isNaN(d.getTime())) return slot.date;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function otherProfile(booking, role) {
  const p = booking.profiles;
  if (Array.isArray(p)) return p[0] ?? null;
  return p ?? null;
}

function bookingToNotification(booking, role) {
  const status = booking.status;
  const cfg = STATUS_MESSAGES[role]?.[status];
  if (!cfg) return null;

  const profile = otherProfile(booking, role);
  const name =
    profile?.name || (role === 'learner' ? 'Your mentor' : 'A learner');
  const dateStr = formatSlotDate(booking.availability_slots);
  const timestamp = booking.updated_at || booking.created_at;

  return {
    id: `${role}-${booking.id}-${status}`,
    type: `booking_${status}`,
    category: 'sessions',
    title: cfg.title,
    body: cfg.body(name, dateStr),
    timestamp,
    icon: cfg.icon,
    accent: cfg.accent,
    avatarUrl: profile?.avatar_url ?? null,
    bookingId: booking.id,
    role,
    status,
  };
}

export const notificationApi = {
  getNotifications: async (userId) => {
    if (!userId) return [];

    const [learnerBookings, mentorBookings] = await Promise.all([
      bookingApi.getBookingsByLearner(userId).catch(() => []),
      bookingApi.getBookingsByMentor(userId).catch(() => []),
    ]);

    const notifications = [];
    (learnerBookings || []).forEach((b) => {
      const n = bookingToNotification(b, 'learner');
      if (n) notifications.push(n);
    });
    (mentorBookings || []).forEach((b) => {
      const n = bookingToNotification(b, 'mentor');
      if (n) notifications.push(n);
    });

    return notifications
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 60);
  },
};
