-- 001_tables.sql
--
-- creates tables for users, milestones, and habits
-- runs automatically the first time the db container starts

CREATE TABLE users (
    id              SERIAL PRIMARY KEY,
    name            TEXT NOT NULL,
    email           TEXT NOT NULL UNIQUE,
    password_hash   TEXT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- each user can have many milestones
CREATE TABLE milestones (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    description     TEXT,
    target_date     DATE,
    completed_on    DATE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- each user can have many habits
-- a habit can optionally belong to one milestone
CREATE TABLE habits (
    id            SERIAL PRIMARY KEY,
    user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    milestone_id  INTEGER REFERENCES milestones(id) ON DELETE SET NULL,
    name          TEXT NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
