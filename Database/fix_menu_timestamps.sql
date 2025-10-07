-- SQL to ensure proper timestamp columns in menu table
-- Run this in your Supabase SQL editor

-- First, check if columns exist and add them if they don't
DO $$
BEGIN
    -- Add created_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'menu' AND column_name = 'created_at') THEN
        ALTER TABLE menu ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'menu' AND column_name = 'updated_at') THEN
        ALTER TABLE menu ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Update existing records that have NULL timestamps
UPDATE menu 
SET created_at = NOW(), updated_at = NOW() 
WHERE created_at IS NULL OR updated_at IS NULL;

-- Create a trigger to automatically update updated_at on every update
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop the trigger if it exists and create it
DROP TRIGGER IF EXISTS update_menu_updated_at ON menu;
CREATE TRIGGER update_menu_updated_at
    BEFORE UPDATE ON menu
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Verify the structure
\d menu;