ALTER TABLE recurring_habits ADD COLUMN IF NOT EXISTS milestone_id INTEGER;

-- Add a foreign key constraint to the milestone_id column, referencing the milestones table
-- Use a DO block so this only runs once if the constraint doesn't already exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'recurring_habits'::regclass AND conname = 'recurring_habits_milestone_owner_fkey'
    ) THEN
        ALTER TABLE recurring_habits ADD CONSTRAINT recurring_habits_milestone_owner_fkey
            FOREIGN KEY (milestone_id, user_id) REFERENCES milestones (id, user_id)
            ON DELETE SET NULL (milestone_id);
    END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS recurring_habits_milestone_idx
    ON recurring_habits (milestone_id) WHERE milestone_id IS NOT NULL;
