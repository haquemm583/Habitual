/*
    habit-progress.test.js

    tests the date and progress helpers in src/habit-progress.js

    to run:
        docker compose exec backend node --test test/habit-progress.test.js
*/
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { habitProgress, localToday, overallProgress, validDate } from "../src/habit-progress.js";

// the weekday numbers start at 0 for Sunday
const WEEKDAYS = [1, 2, 3, 4, 5];

function makeHabit(changes = {}) {
    /*
        builds a fake habit that started on Monday 2026-11-02
        and happens Monday through Friday

        Args:
            changes (object) - any fields to replace on the default habit

        Returns:
            object - the habit in the same shape the database code builds
    */
    return {
        id: 1,
        name: "Walk",
        description: "",
        archived: false,
        startDate: "2026-11-02",
        schedules: [{ effectiveDate: "2026-11-02", weekdays: WEEKDAYS }],
        periods: [{ id: 1, startedOn: "2026-11-02", endedOn: null }],
        completions: [],
        ...changes,
    };
}

describe("validDate", () => {
    /* testing suite for validDate */

    test("accepts real dates and rejects fake ones", () => {
        // 2024 is a leap year but 2026 is not
        assert.equal(validDate("2024-02-29"), true);
        assert.equal(validDate("2026-02-29"), false);

        // the month must have two digits
        assert.equal(validDate("2026-2-03"), false);
    });
});

describe("localToday", () => {
    /* testing suite for localToday */

    test("uses the user's timezone to pick today", () => {
        // 12:30am UTC is still the day before in Chicago but already the next day in Tokyo
        const now = new Date("2026-11-19T00:30:00Z");
        assert.equal(localToday("America/Chicago", now), "2026-11-18");
        assert.equal(localToday("Asia/Tokyo", now), "2026-11-19");
    });
});

describe("habitProgress streaks", () => {
    /* testing suite for the currentStreak and longestStreak from habitProgress */

    test("weekends do not break a weekday streak", () => {
        // completed Monday through Friday, today is the next Monday
        const habit = makeHabit({ completions: ["2026-11-02", "2026-11-03", "2026-11-04", "2026-11-05", "2026-11-06"] });
        const progress = habitProgress(habit, "2026-11-09", "2026-11");

        assert.equal(progress.currentStreak, 5);
        assert.equal(progress.longestStreak, 5);
    });

    test("a missed day breaks the streak", () => {
        // completed last week but skipped Monday, today is Tuesday
        const habit = makeHabit({ completions: ["2026-11-02", "2026-11-03", "2026-11-04", "2026-11-05", "2026-11-06"] });
        const progress = habitProgress(habit, "2026-11-10", "2026-11");

        assert.equal(progress.currentStreak, 0);
        assert.equal(progress.longestStreak, 5);
    });

    test("restoring an archived habit starts a new streak", () => {
        // three days done, then archived and restored on 2026-11-09
        const habit = makeHabit({
            periods: [
                { id: 1, startedOn: "2026-11-02", endedOn: "2026-11-04" },
                { id: 2, startedOn: "2026-11-09", endedOn: null },
            ],
            completions: ["2026-11-02", "2026-11-03", "2026-11-04"],
        });
        const progress = habitProgress(habit, "2026-11-09", "2026-11");

        // the current streak resets but the longest streak is kept
        assert.equal(progress.currentStreak, 0);
        assert.equal(progress.longestStreak, 3);
    });
});

describe("habitProgress percentages", () => {
    /* testing suite for the week and month totals from habitProgress */

    test("counts today but not future days", () => {
        // done Monday, today is Tuesday and not done yet
        const habit = makeHabit({ completions: ["2026-11-02"] });
        const progress = habitProgress(habit, "2026-11-03", "2026-11");

        assert.deepEqual(progress.week, { completed: 1, scheduled: 2, percent: 50 });
        assert.deepEqual(progress.month, { completed: 1, scheduled: 2, percent: 50 });

        // the calendar has every day of November, with tomorrow marked as future
        assert.equal(progress.calendar.length, 30);
        assert.equal(progress.calendar.find((day) => day.date === "2026-11-04").future, true);
    });
});

describe("overallProgress", () => {
    /* testing suite for overallProgress */

    test("adds up habits and skips archived ones", () => {
        const active = habitProgress(makeHabit({ completions: ["2026-11-02"] }), "2026-11-03", "2026-11");
        const archived = habitProgress(makeHabit({ id: 2, archived: true, completions: ["2026-11-02"] }), "2026-11-03", "2026-11");
        const summary = overallProgress([active, archived], "2026-11");

        // only the active habit should be counted
        assert.deepEqual(summary.month, { completed: 1, scheduled: 2, percent: 50 });
        assert.equal(summary.today.scheduled, 1);
    });
});
