-- Migration: Fix notification table to have proper ID column
-- This ensures notifications have unique IDs for tracking

-- Check if id column exists and add it if not
DO $$
BEGIN
    -- Try to add id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'notification' AND column_name = 'id'
    ) THEN
        -- Add id column as serial (auto-increment)
        ALTER TABLE notification ADD COLUMN id SERIAL PRIMARY KEY;
    ELSE
        -- If id exists but isn't primary key, make it primary key
        BEGIN
            ALTER TABLE notification ADD PRIMARY KEY (id);
        EXCEPTION
            WHEN others THEN
                -- Primary key might already exist, ignore error
                RAISE NOTICE 'Primary key already exists or other constraint present';
        END;
    END IF;
END $$;

-- Ensure id column is set to auto-increment if it exists
DO $$
BEGIN
    -- Create sequence if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'notification_id_seq') THEN
        CREATE SEQUENCE notification_id_seq;
        ALTER TABLE notification ALTER COLUMN id SET DEFAULT nextval('notification_id_seq');
        ALTER SEQUENCE notification_id_seq OWNED BY notification.id;
        -- Set sequence to start after existing IDs
        PERFORM setval('notification_id_seq', COALESCE((SELECT MAX(id) FROM notification), 0) + 1, false);
    END IF;
END $$;

-- Success message
SELECT 'Migration completed: Fixed notification table ID column' AS status;
