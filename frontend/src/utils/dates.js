/*
  dates.js

  Helpers for milestone dates. The API sends these as plain YYYY-MM-DD
  strings with no time or timezone. These helpers use the browser's local
  time, so a date never shifts by a day because of a timezone.

  Created by: Joseph Duff
  Created on: 11/20/2026
*/

// today's date in the user's own timezone as YYYY-MM-DD
export function todayString() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

// "2026-12-01" -> "Dec 1, 2026"
export function formatDate(dateString) {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// true when the date is before today. YYYY-MM-DD strings sort correctly as text.
export function isPastDate(dateString) {
  return dateString < todayString();
}