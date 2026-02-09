/**
 * Utility helpers for the GHL Attendance Tracker
 */

// Format date to YYYY-MM-DD
export function formatDate(date) {
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}

// Format date for display
export function formatDisplayDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

// Format date long form
export function formatLongDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// Format time for display (HH:MM -> 12hr)
export function formatTime(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':');
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${m} ${ampm}`;
}

// Get current date as YYYY-MM-DD
export function today() {
  return formatDate(new Date());
}

// Get date N days ago
export function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return formatDate(d);
}

// Day of week names
export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Check if a student hasn't attended in 5+ days
export function isNoShowAlert(lastAttendedDate) {
  if (!lastAttendedDate) return true;
  const last = new Date(lastAttendedDate);
  const now = new Date();
  const diffMs = now - last;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return diffDays >= 5;
}

// Calculate days since last attendance
export function daysSinceAttendance(lastAttendedDate) {
  if (!lastAttendedDate) return Infinity;
  const last = new Date(lastAttendedDate);
  const now = new Date();
  const diffMs = now - last;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

// Calculate attendance rate
export function attendanceRate(attended, total) {
  if (total === 0) return 0;
  return Math.round((attended / total) * 100);
}

// Generate unique ID
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// Get classes scheduled for a given date
export function getClassesForDate(classes, date) {
  const dayName = DAY_NAMES[new Date(date).getDay()];
  return classes.filter(
    (cls) => cls.scheduleDays && cls.scheduleDays.includes(dayName)
  );
}

// Sort classes by start time
export function sortByTime(classes) {
  return [...classes].sort((a, b) => {
    if (!a.startTime || !b.startTime) return 0;
    return a.startTime.localeCompare(b.startTime);
  });
}

// Color palette for classes
export const CLASS_COLORS = [
  { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500', accent: '#3B82F6' },
  { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500', accent: '#10B981' },
  { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', dot: 'bg-violet-500', accent: '#8B5CF6' },
  { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500', accent: '#F59E0B' },
  { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500', accent: '#F43F5E' },
  { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', dot: 'bg-teal-500', accent: '#14B8A6' },
  { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', dot: 'bg-sky-500', accent: '#0EA5E9' },
  { bg: 'bg-fuchsia-50', text: 'text-fuchsia-700', border: 'border-fuchsia-200', dot: 'bg-fuchsia-500', accent: '#D946EF' },
];

export function getClassColor(index) {
  return CLASS_COLORS[index % CLASS_COLORS.length];
}

// Build calendar grid for a given month
export function getCalendarDays(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDow = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const days = [];
  // Pad start
  for (let i = 0; i < startDow; i++) {
    days.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(new Date(year, month, d));
  }
  return days;
}
