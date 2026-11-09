-- 001_tables.sql
--
-- creates tables for users, milestones, and habits
-- runs automatically the first time the db container starts


-- needed for case-insensitive email addresses
CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE users (
    id              SERIAL PRIMARY KEY,
    name            TEXT NOT NULL,
    email           CITEXT NOT NULL UNIQUE,
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
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- lets other tables reference (id, user_id) as a composite key
    -- this constraint is to ensure that a habit can only belong to a milestone owned by the same user
    UNIQUE (id, user_id)
);

-- each user can have many habits
-- a habit can optionally belong to one milestone
CREATE TABLE habits (
    id            SERIAL PRIMARY KEY,
    user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    milestone_id  INTEGER,
    name          TEXT NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- the milestone must belong to the same user as the habit
    FOREIGN KEY (milestone_id, user_id)
        REFERENCES milestones (id, user_id)
        ON DELETE SET NULL (milestone_id)
);

-- indexes on foreign key columns for faster lookups

-- speeds up "all milestones for user X" and cascading user deletes
CREATE INDEX milestones_user_id_idx ON milestones (user_id);

-- speeds up "all habits for user X" and cascading user deletes
CREATE INDEX habits_user_id_idx ON habits (user_id);

-- speeds up "all habits for milestone X" and the SET NULL when a milestone is deleted
CREATE INDEX habits_milestone_id_idx ON habits (milestone_id)
    WHERE milestone_id IS NOT NULL;
