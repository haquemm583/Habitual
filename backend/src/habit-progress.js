const dayMs = 86400000;

// Calendar arithmetic uses UTC dates, never elapsed local hours across DST.
export function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const time = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === value && value >= '1900-01-01';
}

export function addDays(date, days) {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * dayMs).toISOString().slice(0, 10);
}

export function weekday(date) {
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}

export function localToday(timezone, now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now);
  const part = (type) => parts.find((entry) => entry.type === type).value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export function monthDates(month) {
  const dates = [];
  for (let date = `${month}-01`; date.slice(0, 7) === month; date = addDays(date, 1)) dates.push(date);
  return dates;
}

export function scheduleOn(habit, date) {
  // Schedules arrive in effective-date order. Keep prior schedules for history.
  let schedule = null;
  for (const entry of habit.schedules) {
    if (entry.effectiveDate > date) break;
    schedule = entry;
  }
  return schedule;
}

export function periodOn(habit, date) {
  // The latest period wins if a habit is archived and restored on the same date.
  return habit.periods.findLast((period) => period.startedOn <= date && (!period.endedOn || period.endedOn >= date));
}

export function isScheduled(habit, date) {
  return date >= habit.startDate && Boolean(periodOn(habit, date)) &&
    Boolean(scheduleOn(habit, date)?.weekdays.includes(weekday(date)));
}

function percentage(completed, scheduled) {
  return { completed, scheduled, percent: scheduled ? Math.round(completed / scheduled * 100) : 0 };
}

export function habitProgress(habit, today, month) {
  const completedDates = new Set(habit.completions);
  const weekStart = addDays(today, -((weekday(today) + 6) % 7));
  let current = 0;
  let longest = 0;
  let weekScheduled = 0;
  let weekCompleted = 0;
  let monthScheduled = 0;
  let monthCompleted = 0;

  for (let date = habit.startDate; date <= today; date = addDays(date, 1)) {
    if (!isScheduled(habit, date)) continue;
    const completed = completedDates.has(date);
    if (date >= weekStart) { weekScheduled += 1; if (completed) weekCompleted += 1; }
    if (date.slice(0, 7) === month) { monthScheduled += 1; if (completed) monthCompleted += 1; }
  }

  // Evaluate periods separately to retain the old longest streak even when
  // archive and restoration share a date. Today's check-in remains one record.
  for (const period of habit.periods) {
    let run = 0;
    const end = period.endedOn && period.endedOn < today ? period.endedOn : today;
    for (let date = period.startedOn; date <= end; date = addDays(date, 1)) {
      if (date < habit.startDate || !scheduleOn(habit, date)?.weekdays.includes(weekday(date))) continue;
      if (completedDates.has(date)) { run += 1; longest = Math.max(longest, run); }
      else if (date < today) run = 0;
    }
    if (!period.endedOn) current = run;
  }

  const calendar = monthDates(month).map((date) => ({
    date, scheduled: isScheduled(habit, date), completed: completedDates.has(date), future: date > today,
  }));
  const schedule = scheduleOn(habit, today) || habit.schedules[0];
  const pending = habit.schedules.find((entry) => entry.effectiveDate > today);
  return {
    id: habit.id, name: habit.name, description: habit.description, startDate: habit.startDate,
    archived: habit.archived, milestoneId: habit.milestoneId, weekdays: schedule.weekdays,
    pendingSchedule: pending || null,
    today: { scheduled: !habit.archived && isScheduled(habit, today), completed: completedDates.has(today) },
    currentStreak: habit.archived ? 0 : current, longestStreak: longest,
    week: percentage(weekCompleted, weekScheduled), month: percentage(monthCompleted, monthScheduled), calendar,
  };
}

export function overallProgress(habits, month) {
  const active = habits.filter((habit) => !habit.archived);
  const total = (period) => percentage(
    active.reduce((sum, habit) => sum + habit[period].completed, 0),
    active.reduce((sum, habit) => sum + habit[period].scheduled, 0),
  );
  return {
    today: percentage(active.filter((habit) => habit.today.scheduled && habit.today.completed).length,
      active.filter((habit) => habit.today.scheduled).length),
    week: total('week'), month: total('month'),
    bestCurrentStreak: Math.max(0, ...active.map((habit) => habit.currentStreak)),
    longestStreak: Math.max(0, ...active.map((habit) => habit.longestStreak)),
    calendar: monthDates(month).map((date, index) => ({
      date, ...percentage(active.filter((habit) => habit.calendar[index].scheduled && habit.calendar[index].completed).length,
        active.filter((habit) => habit.calendar[index].scheduled).length),
      future: active[0]?.calendar[index].future ?? false,
    })),
  };
}
