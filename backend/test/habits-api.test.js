/*
    habits-api.test.js

    tests the /api/habits endpoints for expected results

    to run (with the containers running):
        docker compose exec backend node --test test/habits-api.test.js
*/
import { test, describe, before } from "node:test";
import assert from "node:assert/strict";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const COOKIE_NAME = "habitual.sid";
const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6];

// generate unique user emails so registering is always successful
const testUser = {
    name: "Habit User",
    email: `habit_${Date.now()}@example.com`,
    password: "Habit-password-123!",
};

// generate a second test user to test users can't
// access other account data
const otherUser = {
    name: "Other Habit User",
    email: `habit_other_${Date.now()}@example.com`,
    password: "Other-password-123!",
};

async function request(method, path, { body, cookie } = {}) {
    /*
        sends a request and returns {status, headers, data}
        every habits request needs a timezone, so UTC is always added

        Args:
            method (str) - the request method such as GET
            path (str) - the path after /api/habits such as "/1/archive"
            body (object) - the request body as a json object
            cookie (str) - the session cookie as "name=value"

        Returns:
            object - an object with {status, headers, data}
    */
    const headers = {};
    if (body) headers["Content-Type"] = "application/json";
    if (cookie) headers["Cookie"] = cookie;

    const res = await fetch(`${BASE_URL}/api/habits${path}?timezone=UTC`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });

    const text = await res.text(); // response body may be empty like in a 204
    const data = text ? JSON.parse(text) : null;

    return { status: res.status, headers: res.headers, data };
}

async function registerAndLogin(user) {
    /*
        registers a user, logs them in, and returns their session cookie

        Args:
            user (object) - the user with name, email, and password

        Returns:
            str - the session cookie as "name=value"
    */
    const options = (body) => ({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });

    await fetch(`${BASE_URL}/api/auth/register`, options(user));
    const res = await fetch(`${BASE_URL}/api/auth/login`, options({ email: user.email, password: user.password }));
    assert.equal(res.status, 200, "login failed during test setup");

    // the cookie looks like "habitual.sid=...; Path=/; HttpOnly" so keep the part before the first ;
    return res.headers.getSetCookie().find((c) => c.startsWith(`${COOKIE_NAME}=`)).split(";")[0];
}

function addDays(date, days) {
    /* returns the YYYY-MM-DD date that is `days` away from `date` */

    const d = new Date(`${date}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
}

async function getHabit(cookie, id) {
    /* returns the habit with this id from GET /api/habits */
    const res = await request("GET", "", { cookie });
    return res.data.habits.find((habit) => habit.id === id);
}

// used for various tests
let cookie;
let otherCookie;
let today;

// get the cookie of user 1 and user 2
before(async () => {
    cookie = await registerAndLogin(testUser);
    otherCookie = await registerAndLogin(otherUser);
    today = (await request("GET", "", { cookie })).data.today;
});

async function createHabit(name = "Walk") {
    /*
        creates a habit that started yesterday and happens
        every day, then returns its id

        This auto passes the cookie and body info so tests below
        are simpler
    */

    const res = await request("POST", "", {
        cookie,
        body: { name, startDate: addDays(today, -1), weekdays: EVERY_DAY },
    });
    assert.equal(res.status, 201);
    return res.data.id;
}

describe("GET /api/habits", () => {
    /* testing suite for GET /api/habits endpoints */

    test("requires login", async () => {
        // tests that getting requires login
        const res = await request("GET", "");
        assert.equal(res.status, 401);
    });

    test("lists the user's habits", async () => {
        // tests habits can be fetched with a proper cookie and UID
        const id = await createHabit("Read");
        const habit = await getHabit(cookie, id);
        assert.equal(habit.name, "Read");
    });

    test("does not show habits from another user", async () => {
        // tests using a different users cookie for the current users UID
        // doesn't fetch anything
        const res = await request("GET", "", { cookie: otherCookie });
        assert.equal(res.status, 200);
        assert.equal(res.data.habits.length, 0);
    });
});

describe("POST /api/habits", () => {
    /* testing suite for POST /api/habits endpoints */

    test("creates a habit", async () => {
        // tests you can create a habit
        const id = await createHabit("Stretch");
        assert.ok(id);
    });

    test("rejects an empty name", async () => {
        // tests an empty habit name fails

        const res = await request("POST", "", {
            cookie,
            body: { name: "  ", startDate: today, weekdays: EVERY_DAY },
        });
        assert.equal(res.status, 400);
    });

    test("rejects a habit with no weekdays", async () => {
        // tests a habit that has no days to repeat on fails to create

        const res = await request("POST", "", {
            cookie,
            body: { name: "Walk", startDate: today, weekdays: [] },
        });
        assert.equal(res.status, 400);
    });
});

describe("PATCH /api/habits/:id", () => {
    /* testing suite for PATCH /api/habits/:id */

    test("renames a habit", async () => {
        // tests renaming a habit works properly

        const id = await createHabit();
        const res = await request("PATCH", `/${id}`, { cookie, body: { name: "Long walk" } });
        assert.equal(res.status, 204);
        assert.equal((await getHabit(cookie, id)).name, "Long walk");
    });

    test("another user cannot edit the habit", async () => {
        // tests another user with a different cookie cannot update other users' habits
        const id = await createHabit();
        const res = await request("PATCH", `/${id}`, { cookie: otherCookie, body: { name: "Hacked" } });
        assert.equal(res.status, 404);
    });
});

describe("PUT /api/habits/:id/checkins/:date", () => {
    /* testing suite for PUT /api/habits/:id/checkins/:date */

    test("checks in and undoes a check-in for today", async () => {
        // checks that marking a habit complete and incomplete updates the
        // status properly
        const id = await createHabit();

        // check in - mark the habit complete for the day
        let res = await request("PUT", `/${id}/checkins/${today}`, { cookie, body: { completed: true } });
        assert.equal(res.status, 204);
        assert.equal((await getHabit(cookie, id)).today.completed, true);

        // undoes the check in by marking a habit as incomplete
        res = await request("PUT", `/${id}/checkins/${today}`, { cookie, body: { completed: false } });
        assert.equal(res.status, 204);
        assert.equal((await getHabit(cookie, id)).today.completed, false);
    });

    test("counts a streak over consecutive days", async () => {
        // tests a streak over consecttive days works

        const id = await createHabit();
        await request("PUT", `/${id}/checkins/${addDays(today, -1)}`, { cookie, body: { completed: true } }); // completed yesterday
        await request("PUT", `/${id}/checkins/${today}`, { cookie, body: { completed: true } }); // completed today
        assert.equal((await getHabit(cookie, id)).currentStreak, 2); // current streak should be 2
    });

    test("rejects a check-in in the future", async () => {
        // ensures you can't check in a habit in a future date
        const id = await createHabit();

        // try to mark the habit for tomorrow as complete
        const res = await request("PUT", `/${id}/checkins/${addDays(today, 1)}`, { cookie, body: { completed: true } });
        assert.equal(res.status, 400); // fail
    });
});

describe("POST /api/habits/:id/archive and /restore", () => {
    /* testing suite for POST /api/habits/:id/archive and /restore endpoints */

    test("archives and restores a habit", async () => {
        // tests the archiving and restoring behavior
        const id = await createHabit();

        // mark as archived
        assert.equal((await request("POST", `/${id}/archive`, { cookie })).status, 204);
        assert.equal((await getHabit(cookie, id)).archived, true);

        // restore it so archived should be false
        assert.equal((await request("POST", `/${id}/restore`, { cookie })).status, 204);
        assert.equal((await getHabit(cookie, id)).archived, false);
    });

    test("an archived habit cannot be edited", async () => {
        // ensures archived tasks cannot be edited

        const id = await createHabit(); // create habit
        await request("POST", `/${id}/archive`, { cookie }); // create it under the archives
        const res = await request("PATCH", `/${id}`, { cookie, body: { name: "Blocked" } }); // try to modify
        assert.equal(res.status, 409);
    });
});

describe("DELETE /api/habits/:id", () => {
    /* testing suite for DELETE /api/habits/:id */

    test("deletes a habit", async () => {
        // tests deleting a habit works properly
        const id = await createHabit();
        assert.equal((await request("DELETE", `/${id}`, { cookie })).status, 204);
        assert.equal(await getHabit(cookie, id), undefined);
    });

    test("another user cannot delete the habit", async () => {
        /* tests a user cannot delete another user's habits */
        const id = await createHabit();
        const res = await request("DELETE", `/${id}`, { cookie: otherCookie });
        assert.equal(res.status, 404);
    });
});
