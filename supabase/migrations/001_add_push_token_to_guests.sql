-- Migration: Add push_token column to guests table
-- Purpose: Store Expo Push Tokens for remote notifications

-- 1. Add push_token column to guests table
ALTER TABLE guests ADD COLUMN IF NOT EXISTS push_token TEXT;

-- 2. Create index for faster token queries
CREATE INDEX IF NOT EXISTS idx_guests_push_token
  ON guests (push_token)
  WHERE push_token IS NOT NULL;

-- 3. Add RLS policy for users to update their own push_token
-- Note: This assumes RLS is already enabled on the guests table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'guests'
    AND policyname = 'Users can update own push_token'
  ) THEN
    CREATE POLICY "Users can update own push_token"
      ON guests
      FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- 4. Comment for documentation
COMMENT ON COLUMN guests.push_token IS 'Expo Push Token for sending remote notifications to this user';
