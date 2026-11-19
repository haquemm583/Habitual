export function deviceTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export function deviceToday() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export async function habitsRequest(path = '', { month, ...options } = {}) {
  const query = new URLSearchParams({ timezone: deviceTimezone() });
  if (month) query.set('month', month);
  const response = await fetch(`/api/habits${path ? `/${path}` : ''}?${query}`, {
    credentials: 'same-origin', ...options,
  });
  if (response.status === 204) return null;
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || 'Unable to reach the server. Please try again.');
  if (!data) throw new Error('The server returned an invalid response. Please try again.');
  return data;
}

export const weekdayOptions = [
  [1, 'Monday'], [2, 'Tuesday'], [3, 'Wednesday'], [4, 'Thursday'], [5, 'Friday'], [6, 'Saturday'], [0, 'Sunday'],
];

export function scheduleLabel(days) {
  return days.length === 7 ? 'Every day' : weekdayOptions.filter(([day]) => days.includes(day)).map(([, label]) => label.slice(0, 3)).join(', ');
}

export function dayCount(count) {
  return `${count} ${count === 1 ? 'day' : 'days'}`;
}

export function dateLabel(date, options = {}) {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString(undefined, { timeZone: 'UTC', year: 'numeric', month: 'long', day: 'numeric', ...options });
}
