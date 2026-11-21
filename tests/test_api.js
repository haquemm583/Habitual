/*
    test_api.js

    tests the api endpoints for expected results

    to run (with the containers running):
        docker compose exec backend node tests/test_api.js

    Created by: CJ Quintero
    Created on: 11/16/2026

    Modified by: Joseph Duff
    Modified on: 11/20/2026
*/
import { test, describe, before } from "node:test";
import assert from "node:assert/strict";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const COOKIE_NAME = "habitual.sid";

// generate unique user emails so registering is always successful
const testUser = {
    name: "Test User",
    email: `test_${Date.now()}@example.com`,
    password: "Test-password-123!",
};

const otherUser = {
    name: "Other User",
    email: `test_other_${Date.now()}@example.com`,
    password: "Other-password-123!",
};

async function request(method, path, { body, cookie, headers: extraHeaders } = {}) {
    /*
        sends a request and returns {status, headers, data}

        Args:
            method (str) - the request method such as GET
            path (str) - the request path such as /api/health
            body (object) - the request body as a json object
            cookie (str) - the session cookie as "name=value"
            headers (object) - any extra headers to send

        Returns:
            object - an object with {status, headers, data}
    */
    const headers = { ...extraHeaders };
    if (body) headers["Content-Type"] = "application/json";
    if (cookie) headers["Cookie"] = cookie;

    const res = await fetch(BASE_URL + path, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });

    const text = await res.text(); // response body may be empty like in a 204
    const data = text ? JSON.parse(text) : null; // only parse if there is a response body

    return { status: res.status, headers: res.headers, data };
}

function getSessionCookie(headers) {
    /*
        helper function that finds our session cookie in the Set-Cookie headers

        Args:
            headers (object) - the headers object from a request

        Returns:
            str - the cookie as "name=value" so it can be sent back, or undefined
    */
    // find the right cookie
    const cookie = headers.getSetCookie().find((c) => c.startsWith(`${COOKIE_NAME}=`));

    // the cookie is written as
    // habitual.sid=...; Path=/; Expires=...; HttpOnly; SameSite=Lax
    // so this splits by the semicolons and gets the first one which is the cookie SID
    return cookie?.split(";")[0];
}

async function registerAndLogin(user) {
    /*
        helper function that registers a user, logs them in, and returns their session cookie

        Args:
            user (object) - the user with name, email, and password

        Returns:
            str - the session cookie as "name=value"
    */
    // register the user. If already exists, just pass and do nothing
    // since the next request requires the user to exist
    await request("POST", "/api/auth/register", { body: user });

    // login the user
    const res = await request("POST", "/api/auth/login", {
        body: { email: user.email, password: user.password },
    });
    assert.equal(res.status, 200, "login failed during test setup");

    // get the session cookie for the newly registered and logged in user
    return getSessionCookie(res.headers);
}

describe("GET /api/health", () => {
    /* testing suite for GET to the /api/health endpoint */

    test("health check", async () => {
        /* tests the health check to ensure the API is working */
        const res = await request("GET", "/api/health");

        assert.equal(res.status, 200);
        assert.deepEqual(res.data, { status: "ok", database: "connected" });
    });
});

describe("POST /api/auth/register", () => {
    /* testing suite for POST to the /api/auth/register endpoint */

    test("create account", async () => {
        /*
            tests that the account creation returns a 201 and
            sends back the id, name, and email.

            the password should not be sent back
        */
        const res = await request("POST", "/api/auth/register", { body: testUser });

        assert.equal(res.status, 201);
        assert.ok(res.data.id, "missing id");
        assert.equal(res.data.name, testUser.name);
        assert.equal(res.data.email, testUser.email);
        assert.equal(res.data.password, undefined, "password must not be sent back");
        assert.equal(res.data.password_hash, undefined, "password hash must not be sent back");
    });

    test("rejects a duplicate email", async () => {
        /*
            tests a 409 is sent back when a duplicate email
            is found in the db
        */
        const res = await request("POST", "/api/auth/register", { body: testUser });

        assert.equal(res.status, 409);
        assert.deepEqual(res.data, { error: "An account with this email already exists." });
    });

    test("rejects a password under 8 characters", async () => {
        /* tests that invalid fields are rejected */
        const res = await request("POST", "/api/auth/register", {
            body: { ...testUser, password: "short", email: `short_${Date.now()}@example.com` },
        });

        assert.equal(res.status, 400);
        assert.deepEqual(res.data, { error: "Password must contain 8 to 128 characters." });
    });
});

describe("POST /api/auth/login", () => {
    /* testing suite for POST to the /api/auth/login endpoint */

    test("login", async () => {
        /*
            tests logging in returns the user and sets
            the session cookie
        */
        const res = await request("POST", "/api/auth/login", {
            body: { email: testUser.email, password: testUser.password },
        });

        assert.equal(res.status, 200);
        assert.equal(res.data.name, testUser.name);
        assert.equal(res.data.email, testUser.email);

        // never send back pass or pass hash
        assert.equal(res.data.password, undefined, "password must not be sent back");
        assert.equal(res.data.password_hash, undefined, "password hash must not be sent back");
        assert.ok(getSessionCookie(res.headers), "missing session cookie");
    });

    test("rejects a wrong password", async () => {
        /* tests that a wrong password does not log in */
        const res = await request("POST", "/api/auth/login", {
            body: { email: testUser.email, password: "wrong-password" },
        });

        assert.equal(res.status, 401);
        assert.deepEqual(res.data, { error: "Invalid email or password." });
        assert.equal(getSessionCookie(res.headers), undefined, "no cookie on failed login");
    });

    test("rejects requests from another origin", async () => {
        /* tests that browser requests from other sites are blocked */
        const res = await request("POST", "/api/auth/login", {
            body: { email: testUser.email, password: testUser.password },
            headers: { Origin: "http://evil.example.com" },
        });
        
        // should block other origins
        assert.equal(res.status, 403);
        assert.deepEqual(res.data, { error: "Request origin is not allowed." });
    });
});

describe("GET /api/auth/me", () => {
    /* testing suite for GET to the /api/auth/me endpoint */

    test("returns the signed in user", async () => {
        /* tests that the session cookie returns the current user */
        const cookie = await registerAndLogin(testUser);
        const res = await request("GET", "/api/auth/me", { cookie });

        // test the endpoint returns the current logged in user's name and email
        assert.equal(res.status, 200);
        assert.equal(res.data.email, testUser.email);
        assert.equal(res.data.name, testUser.name);

        // pass and hashed pass should never be sent back
        assert.equal(res.data.password, undefined, "password must not be sent back");
        assert.equal(res.data.password_hash, undefined, "password hash must not be sent back");
    });

    test("rejects a request with no cookie", async () => {
        /* tests that the endpoint requires a session */
        const res = await request("GET", "/api/auth/me");

        assert.equal(res.status, 401);
        assert.deepEqual(res.data, { error: "Login required." });
    });
});

describe("POST /api/auth/logout", () => {
    /* testing suite for POST to the /api/auth/logout endpoint */

    test("logout ends the session", async () => {
        /*
            tests that logging out deletes the session,
            so the old cookie no longer works
        */
        const cookie = await registerAndLogin(testUser);

        // logout
        const res = await request("POST", "/api/auth/logout", { cookie });
        assert.equal(res.status, 204);

        // test the endpoint doesn't work when logged out
        const me = await request("GET", "/api/auth/me", { cookie });
        assert.equal(me.status, 401);
    });
});

describe("/api/tasks", () => {
    /* testing suite for the /api/tasks endpoints */

    let cookie;
    let otherCookie;
    let taskId;

    before(async () => {
        cookie = await registerAndLogin(testUser);
        otherCookie = await registerAndLogin(otherUser);
    });

    test("requires login", async () => {
        /* tests that the tasks endpoints reject requests with no session */
        const res = await request("GET", "/api/tasks");

        assert.equal(res.status, 401);
        assert.deepEqual(res.data, { error: "Login required." });
    });

    test("POST creates a task", async () => {
        /* tests that creating a task defaults completed to false */
        const res = await request("POST", "/api/tasks", { cookie, body: { name: "Drink water" } });

        // check for expected fields in the response
        assert.equal(res.status, 201);
        assert.ok(res.data.id, "missing id");
        assert.equal(res.data.name, "Drink water");
        assert.equal(res.data.completed, false);

        // used for other tests
        taskId = res.data.id;
    });

    test("POST rejects an empty name", async () => {
        /* tests that a blank task name is rejected */
        const res = await request("POST", "/api/tasks", { cookie, body: { name: "   " } });

        // should reject when name field is missing
        assert.equal(res.status, 400);
        assert.deepEqual(res.data, { error: "Task name must contain 1 to 200 characters." });
    });

    test("GET lists the user's tasks", async () => {
        /* tests that the created task is returned */
        const res = await request("GET", "/api/tasks", { cookie });

        // ensure the task that was created in another test is found here
        assert.equal(res.status, 200);
        assert.ok(res.data.some((task) => task.id === taskId), "created task is missing");
    });

    test("PATCH updates a task and saves it", async () => {
        /* tests marking a task complete and that the change is saved */
        const res = await request("PATCH", `/api/tasks/${taskId}`, { cookie, body: { completed: true } });

        // update successful
        assert.equal(res.status, 200);
        assert.equal(res.data.completed, true);

        // enusure the update also appears when getting the entire task list
        const list = await request("GET", "/api/tasks", { cookie });
        const task = list.data.find((item) => item.id === taskId);
        assert.equal(task.completed, true);
    });

    test("another user cannot see, update, or delete the task", async () => {
        /* tests that users can only access their own tasks */

        // test that another user cannot see another user's tasks
        const list = await request("GET", "/api/tasks", { cookie: otherCookie });
        assert.ok(!list.data.some((task) => task.id === taskId), "another user's task was returned");

        // test that another user cannot update another user's tasks
        const update = await request("PATCH", `/api/tasks/${taskId}`, {
            cookie: otherCookie,
            body: { name: "Hacked" },
        });
        assert.equal(update.status, 404);
        
        // test that another user cannot delete another user's tasks
        const remove = await request("DELETE", `/api/tasks/${taskId}`, { cookie: otherCookie });
        assert.equal(remove.status, 404);
    });

    test("DELETE deletes a task", async () => {
        /* tests deleting a task and that it is gone afterwards */

        // delete task
        const res = await request("DELETE", `/api/tasks/${taskId}`, { cookie });
        assert.equal(res.status, 204);

        // ensure it was deleted from db
        const list = await request("GET", "/api/tasks", { cookie });
        assert.ok(!list.data.some((task) => task.id === taskId), "deleted task is still listed");
    });
});

describe("/api/milestones", () => {
    /* testing suite for the /api/milestones endpoints */

    let cookie;
    let otherCookie;
    let milestoneId;

    before(async () => {
        cookie = await registerAndLogin(testUser);
        otherCookie = await registerAndLogin(otherUser);
    });

    test("requires login", async () => {
        /* tests that the milestones endpoints reject requests with no session */
        const res = await request("GET", "/api/milestones");

        assert.equal(res.status, 401);
        assert.deepEqual(res.data, { error: "Login required." });
    });

    test("POST creates a milestone with just a name", async () => {
        /* tests that the description and dates are optional and default to null */
        const res = await request("POST", "/api/milestones", { cookie, body: { name: "Run a 5k" } });

        // check for expected fields in the response
        assert.equal(res.status, 201);
        assert.ok(res.data.id, "missing id");
        assert.equal(res.data.name, "Run a 5k");
        assert.equal(res.data.description, null);
        assert.equal(res.data.targetDate, null);
        assert.equal(res.data.completedOn, null);

        // used for other tests
        milestoneId = res.data.id;
    });

    test("POST saves a description and target date", async () => {
        /* tests that the target date comes back as the same plain YYYY-MM-DD string */
        const res = await request("POST", "/api/milestones", {
            cookie,
            body: { name: "Read 12 books", description: "One a month", targetDate: "2098-12-31" },
        });

        assert.equal(res.status, 201);
        assert.equal(res.data.description, "One a month");
        assert.equal(res.data.targetDate, "2098-12-31");
    });

    test("POST rejects an empty name", async () => {
        /* tests that a blank milestone name is rejected */
        const res = await request("POST", "/api/milestones", { cookie, body: { name: "   " } });

        assert.equal(res.status, 400);
        assert.deepEqual(res.data, { error: "Milestone name must contain 1 to 200 characters." });
    });

    test("POST rejects an invalid target date", async () => {
        /* tests that dates must be real dates written as YYYY-MM-DD */
        const badFormat = await request("POST", "/api/milestones", {
            cookie,
            body: { name: "Bad date", targetDate: "12/31/2098" },
        });
        assert.equal(badFormat.status, 400);
        assert.deepEqual(badFormat.data, { error: "Target date must be YYYY-MM-DD." });

        // right format, but February 30th does not exist
        const notReal = await request("POST", "/api/milestones", {
            cookie,
            body: { name: "Bad date", targetDate: "2098-02-30" },
        });
        assert.equal(notReal.status, 400);
        assert.deepEqual(notReal.data, { error: "Target date must be YYYY-MM-DD." });
    });

    test("GET lists the user's milestones with the soonest target date first", async () => {
        /* tests the list order: soonest target date first, milestones with no date last */
        const none = await request("POST", "/api/milestones", { cookie, body: { name: "No date" } });
        const late = await request("POST", "/api/milestones", {
            cookie,
            body: { name: "Late", targetDate: "2099-06-01" },
        });
        const soon = await request("POST", "/api/milestones", {
            cookie,
            body: { name: "Soon", targetDate: "2098-06-01" },
        });

        const res = await request("GET", "/api/milestones", { cookie });
        assert.equal(res.status, 200);

        // only look at the three milestones from this test since others exist from other tests
        const ids = [none.data.id, late.data.id, soon.data.id];
        const order = res.data.filter((item) => ids.includes(item.id)).map((item) => item.id);
        assert.deepEqual(order, [soon.data.id, late.data.id, none.data.id]);
    });

    test("GET returns a single milestone", async () => {
        /* tests getting a milestone by its id */
        const res = await request("GET", `/api/milestones/${milestoneId}`, { cookie });

        assert.equal(res.status, 200);
        assert.equal(res.data.id, milestoneId);
        assert.equal(res.data.name, "Run a 5k");
    });

    test("GET rejects an invalid id", async () => {
        /* tests that ids that are not positive whole numbers are rejected */
        const res = await request("GET", "/api/milestones/abc", { cookie });

        assert.equal(res.status, 400);
        assert.deepEqual(res.data, { error: "Invalid milestone ID." });
    });

    test("PATCH updates a milestone and saves it", async () => {
        /* tests that only the fields that are sent change, and that the change is saved */
        const res = await request("PATCH", `/api/milestones/${milestoneId}`, {
            cookie,
            body: { name: "Run a 10k", targetDate: "2098-03-04" },
        });

        // update successful
        assert.equal(res.status, 200);
        assert.equal(res.data.name, "Run a 10k");
        assert.equal(res.data.targetDate, "2098-03-04");

        // ensure the update is saved when getting the milestone again
        const saved = await request("GET", `/api/milestones/${milestoneId}`, { cookie });
        assert.equal(saved.data.name, "Run a 10k");
        assert.equal(saved.data.targetDate, "2098-03-04");

        // null clears an optional field
        const cleared = await request("PATCH", `/api/milestones/${milestoneId}`, {
            cookie,
            body: { targetDate: null },
        });
        assert.equal(cleared.status, 200);
        assert.equal(cleared.data.targetDate, null);
        assert.equal(cleared.data.name, "Run a 10k");
    });

    test("PATCH marks a milestone completed and open again", async () => {
        /* tests setting the completed date and then clearing it */
        const done = await request("PATCH", `/api/milestones/${milestoneId}`, {
            cookie,
            body: { completedOn: "2026-11-20" },
        });
        assert.equal(done.status, 200);
        assert.equal(done.data.completedOn, "2026-11-20");

        const reopened = await request("PATCH", `/api/milestones/${milestoneId}`, {
            cookie,
            body: { completedOn: null },
        });
        assert.equal(reopened.status, 200);
        assert.equal(reopened.data.completedOn, null);
    });

    test("PATCH rejects an empty update and invalid fields", async () => {
        /* tests that an update needs at least one valid field */
        const empty = await request("PATCH", `/api/milestones/${milestoneId}`, { cookie, body: {} });
        assert.equal(empty.status, 400);

        const badName = await request("PATCH", `/api/milestones/${milestoneId}`, {
            cookie,
            body: { name: "   " },
        });
        assert.equal(badName.status, 400);
        assert.deepEqual(badName.data, { error: "Milestone name must contain 1 to 200 characters." });

        const badDate = await request("PATCH", `/api/milestones/${milestoneId}`, {
            cookie,
            body: { completedOn: "yesterday" },
        });
        assert.equal(badDate.status, 400);
        assert.deepEqual(badDate.data, { error: "Completed date must be YYYY-MM-DD." });
    });

    test("another user cannot see, update, or delete the milestone", async () => {
        /* tests that users can only access their own milestones */

        // test that another user cannot see another user's milestones
        const list = await request("GET", "/api/milestones", { cookie: otherCookie });
        assert.ok(!list.data.some((item) => item.id === milestoneId), "another user's milestone was returned");

        const get = await request("GET", `/api/milestones/${milestoneId}`, { cookie: otherCookie });
        assert.equal(get.status, 404);

        // test that another user cannot update another user's milestones
        const update = await request("PATCH", `/api/milestones/${milestoneId}`, {
            cookie: otherCookie,
            body: { name: "Hacked" },
        });
        assert.equal(update.status, 404);

        // test that another user cannot delete another user's milestones
        const remove = await request("DELETE", `/api/milestones/${milestoneId}`, { cookie: otherCookie });
        assert.equal(remove.status, 404);

        // ensure the milestone was not changed by any of that
        const saved = await request("GET", `/api/milestones/${milestoneId}`, { cookie });
        assert.equal(saved.data.name, "Run a 10k");
    });

    test("DELETE deletes a milestone", async () => {
        /* tests deleting a milestone and that it is gone afterwards */

        // delete milestone
        const res = await request("DELETE", `/api/milestones/${milestoneId}`, { cookie });
        assert.equal(res.status, 204);

        // ensure it was deleted from db
        const list = await request("GET", "/api/milestones", { cookie });
        assert.ok(!list.data.some((item) => item.id === milestoneId), "deleted milestone is still listed");

        const get = await request("GET", `/api/milestones/${milestoneId}`, { cookie });
        assert.equal(get.status, 404);
    });
});
