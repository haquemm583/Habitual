-- Applied on backend startup for both new and existing database volumes.
-- The original habits table continues to hold one-time tasks.
CREATE TABLE IF NOT EXISTS recurring_habits (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 200),
    description TEXT NOT NULL DEFAULT '' CHECK (length(description) <= 2000),
    start_date DATE NOT NULL,
    archived BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS recurring_habits_user_idx ON recurring_habits (user_id);

CREATE TABLE IF NOT EXISTS habit_schedules (
    habit_id INTEGER NOT NULL REFERENCES recurring_habits(id) ON DELETE CASCADE,
    effective_date DATE NOT NULL,
    weekdays INTEGER[] NOT NULL,
    PRIMARY KEY (habit_id, effective_date),
    CHECK (cardinality(weekdays) BETWEEN 1 AND 7 AND weekdays <@ ARRAY[0,1,2,3,4,5,6])
);

CREATE TABLE IF NOT EXISTS habit_active_periods (
    id SERIAL PRIMARY KEY,
    habit_id INTEGER NOT NULL REFERENCES recurring_habits(id) ON DELETE CASCADE,
    started_on DATE NOT NULL,
    ended_on DATE
);

CREATE INDEX IF NOT EXISTS habit_active_periods_habit_idx ON habit_active_periods (habit_id);
CREATE UNIQUE INDEX IF NOT EXISTS habit_one_open_period_idx
    ON habit_active_periods (habit_id) WHERE ended_on IS NULL;

CREATE TABLE IF NOT EXISTS habit_checkins (
    habit_id INTEGER NOT NULL REFERENCES recurring_habits(id) ON DELETE CASCADE,
    completed_on DATE NOT NULL,
    PRIMARY KEY (habit_id, completed_on)
);
