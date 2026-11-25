-- Rename the original one-time task table without rewriting any rows.
-- this renames the old table to tasks and updates
-- indexes and constraints to match the new name.
DO $$
DECLARE
    old_constraint TEXT;
BEGIN
    IF to_regclass('habits') IS NOT NULL THEN
        ALTER TABLE habits RENAME TO tasks;

        FOR old_constraint IN
            SELECT conname FROM pg_constraint
            WHERE conrelid = 'tasks'::regclass AND starts_with(conname, 'habits_')
        LOOP
            EXECUTE format('ALTER TABLE tasks RENAME CONSTRAINT %I TO %I',
                           old_constraint, regexp_replace(old_constraint, '^habits_', 'tasks_'));
        END LOOP;

        ALTER INDEX IF EXISTS habits_user_id_idx RENAME TO tasks_user_id_idx;
        ALTER INDEX IF EXISTS habits_milestone_id_idx RENAME TO tasks_milestone_id_idx;
        ALTER SEQUENCE IF EXISTS habits_id_seq RENAME TO tasks_id_seq;
    END IF;
END;
$$;

-- Older database volumes may predate task completion.
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed BOOLEAN NOT NULL DEFAULT FALSE;
