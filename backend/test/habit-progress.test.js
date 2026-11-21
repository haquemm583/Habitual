import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addDays, habitProgress, isScheduled, localToday, overallProgress, validDate } from '../src/habit-progress.js';

function fixture(overrides = {}) {
  return {
    id: 1, name: 'Walk', description: '', archived: false, startDate: '2026-11-02',
    schedules: [{ effectiveDate: '2026-11-02', weekdays: [1, 2, 3, 4, 5] }],
    periods: [{ id: 1, startedOn: '2026-11-02', endedOn: null }],
    completions: [], ...overrides,
  };
}

test('calendar dates reject rollovers and use calendar arithmetic across leap days and DST', () => {
  assert.equal(validDate('2026-02-29'), false);
  assert.equal(validDate('2024-02-29'), true);
  assert.equal(validDate('2026-2-03'), false);
  assert.equal(addDays('2024-02-28', 1), '2024-02-29');
  assert.equal(addDays('2026-03-08', 1), '2026-03-09');
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
});

test('device timezone determines today around midnight and daylight saving transitions', () => {
  const now = new Date('2026-11-19T00:30:00Z');
  assert.equal(localToday('America/Chicago', now), '2026-11-18');
  assert.equal(localToday('Asia/Tokyo', now), '2026-11-19');
  assert.equal(localToday('America/Chicago', new Date('2026-11-01T06:30:00Z')), '2026-11-01');
  assert.equal(localToday('America/Chicago', new Date('2026-11-01T07:30:00Z')), '2026-11-01');
});

test('unscheduled weekends and unfinished today preserve the streak, missed past days break it', () => {
  const habit = fixture({ completions: ['2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06'] });
  assert.equal(habitProgress(habit, '2026-11-09', '2026-11').currentStreak, 5);
  assert.equal(habitProgress(habit, '2026-11-09', '2026-11').longestStreak, 5);
  assert.equal(habitProgress(habit, '2026-11-10', '2026-11').currentStreak, 0);
  habit.completions.push('2026-11-10');
  assert.equal(habitProgress(habit, '2026-11-10', '2026-11').currentStreak, 1);
  habit.completions.push('2026-11-09');
  assert.equal(habitProgress(habit, '2026-11-10', '2026-11').currentStreak, 7);
});

test('schedule changes preserve prior scheduled dates and check-ins', () => {
  const habit = fixture({ schedules: [
    { effectiveDate: '2026-11-02', weekdays: [1, 2, 3, 4, 5] },
    { effectiveDate: '2026-11-10', weekdays: [0, 6] },
  ], completions: ['2026-11-09'] });
  assert.equal(isScheduled(habit, '2026-11-09'), true);
  assert.equal(isScheduled(habit, '2026-11-10'), false);
  assert.equal(isScheduled(habit, '2026-11-14'), true);
  assert.deepEqual(habitProgress(habit, '2026-11-09', '2026-11').pendingSchedule.weekdays, [0, 6]);
  assert.equal(habitProgress(habit, '2026-11-14', '2026-11').calendar.find((day) => day.date === '2026-11-09').completed, true);
});

test('archive gaps are not scheduled; restore resets current streak and preserves longest streak', () => {
  const habit = fixture({ periods: [
    { id: 1, startedOn: '2026-11-02', endedOn: '2026-11-04' },
    { id: 2, startedOn: '2026-11-09', endedOn: null },
  ], completions: ['2026-11-02', '2026-11-03', '2026-11-04'] });
  assert.equal(isScheduled(habit, '2026-11-05'), false);
  const progress = habitProgress(habit, '2026-11-09', '2026-11');
  assert.equal(progress.currentStreak, 0);
  assert.equal(progress.longestStreak, 3);
  habit.completions.push('2026-11-09');
  assert.equal(habitProgress(habit, '2026-11-09', '2026-11').currentStreak, 1);
});

test('same-day restoration starts a new streak without deleting today’s completion', () => {
  const habit = fixture({ periods: [
    { id: 1, startedOn: '2026-11-02', endedOn: '2026-11-04' },
    { id: 2, startedOn: '2026-11-04', endedOn: null },
  ], completions: ['2026-11-02', '2026-11-03', '2026-11-04'] });
  const progress = habitProgress(habit, '2026-11-04', '2026-11');
  assert.equal(progress.currentStreak, 1);
  assert.equal(progress.longestStreak, 3);
});

test('percentages include unfinished today, exclude future dates, and start weeks Monday', () => {
  const habit = fixture({ completions: ['2026-11-02'] });
  const progress = habitProgress(habit, '2026-11-03', '2026-11');
  assert.deepEqual(progress.week, { completed: 1, scheduled: 2, percent: 50 });
  assert.deepEqual(progress.month, { completed: 1, scheduled: 2, percent: 50 });
  assert.equal(progress.calendar.length, 30);
  assert.equal(progress.calendar.find((day) => day.date === '2026-11-04').future, true);
  assert.equal(habitProgress(habit, '2026-11-09', '2026-11').week.scheduled, 1);
});

test('future starts produce no due habits, historical penalties, or streaks', () => {
  const habit = fixture({ startDate: '2026-12-01', schedules: [{ effectiveDate: '2026-12-01', weekdays: [0, 1, 2, 3, 4, 5, 6] }], periods: [{ id: 1, startedOn: '2026-12-01', endedOn: null }] });
  const progress = habitProgress(habit, '2026-11-19', '2026-12');
  assert.equal(progress.today.scheduled, false);
  assert.equal(progress.month.scheduled, 0);
  assert.equal(progress.currentStreak, 0);
});

test('the weekly strip includes both months and distinguishes a future scheduled day', () => {
  const habit = fixture({
    startDate: '2026-08-31',
    schedules: [{ effectiveDate: '2026-08-31', weekdays: [1, 2, 3, 4, 5] }],
    periods: [{ id: 1, startedOn: '2026-08-31', endedOn: null }],
    completions: ['2026-08-31'],
  });
  const progress = habitProgress(habit, '2026-09-01', '2026-09');
  assert.equal(progress.weekDays.length, 7);
  assert.deepEqual(progress.weekDays[0], { date: '2026-08-31', scheduled: true, completed: true, future: false });
  assert.deepEqual(progress.weekDays[1], { date: '2026-09-01', scheduled: true, completed: false, future: false });
  assert.deepEqual(progress.weekDays[2], { date: '2026-09-02', scheduled: true, completed: false, future: true });
  assert.deepEqual(progress.weekDays[6], { date: '2026-09-06', scheduled: false, completed: false, future: true });
  assert.deepEqual(progress.week, { completed: 1, scheduled: 2, percent: 50 });
});

test('overall counts weight scheduled check-ins and omit archived habits including past dates', () => {
  const first = habitProgress(fixture({ completions: ['2026-11-02'] }), '2026-11-03', '2026-11');
  const second = habitProgress(fixture({ id: 2, archived: true, completions: ['2026-11-02', '2026-11-03'] }), '2026-11-03', '2026-11');
  const summary = overallProgress([first, second], '2026-11');
  assert.deepEqual(summary.month, { completed: 1, scheduled: 2, percent: 50 });
  assert.equal(summary.calendar.find((day) => day.date === '2026-11-02').completed, 1);
  assert.equal(summary.today.scheduled, 1);
  assert.deepEqual(overallProgress([], '2026-11').month, { completed: 0, scheduled: 0, percent: 0 });
});
