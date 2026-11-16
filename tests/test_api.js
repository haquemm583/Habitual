/*
    test_api.js

    tests the api endpoints for expected results
    
    to run:
        docker exec habitual-backend node tests/test_api.js

    Created by: CJ Quintero
    Created on: 11/16/2026
*/
import { test, describe, before } from "node:test";
import assert from "node:assert/strict";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const COOKIE_NAME = "habitual.sid";

// generate a unique user email so registering is always successful
const testUser = {
    name: "Test User",
    email: `test_${Date.now()}@example.com`,
    password: "Test-password-123!",
};

async function request(method, path, {body, cookie} = {}) {
    /*
        sends a request and returns {status, headers, data}

        Args:
            method (str) - the request method such as GET
            path (str) - the request path such as /api/health
            body (object) - the request body as a json object
            cookie (object) - the cookie object as json
        
        Returns:
            object - an object with {status, headers, data}
    */
    const headers = {};
    if (body) headers["Content-Type"] = "application/json";
    if (cookie) headers["Cookie"] = cookie;

    const res = await fetch(BASE_URL + path, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });

    const text = await res.text();
    const data = text ? JSON.parse(text) : null;

    return { status: res.status, headers: res.headers, data };
}

function getSessionCookie(headers) {
    /*
        finds our session cookie n the Set-Cookie headers

        Args:
            headers (object) - the headers object from a request
        
        Returns:
            object - the cookie object
    */
    return headers.getSetCookie().find((c) => c.startsWith(`${COOKIE_NAME}=`));
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
    });

    test("rejects a duplicate email (409)", async () => {
        /*
            tests a 409 is sent back when a duplicate email
            is found in the db
        */
        const res = await request("POST", "/api/auth/register", { body: testUser });

        assert.equal(res.status, 409);
        assert.deepEqual(res.data, { error: "An account with this email already exists." });
    });
});