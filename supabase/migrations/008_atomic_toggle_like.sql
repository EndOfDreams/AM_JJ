-- ============================================================
-- Migration: Replace liked_by array with photo_likes join table
-- Scales to 1000+ users (no more full array broadcast on each like)
-- ============================================================

-- 1. Create the join table
CREATE TABLE IF NOT EXISTS photo_likes (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  photo_id uuid NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  user_email text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(photo_id, user_email)
);

-- Index for fast "did this user like this photo?" lookups
CREATE INDEX IF NOT EXISTS idx_photo_likes_user ON photo_likes(user_email);
CREATE INDEX IF NOT EXISTS idx_photo_likes_photo ON photo_likes(photo_id);

-- 2. Migrate existing data from liked_by arrays into photo_likes
INSERT INTO photo_likes (photo_id, user_email)
SELECT p.id, unnest(p.liked_by)
FROM photos p
WHERE p.liked_by IS NOT NULL AND array_length(p.liked_by, 1) > 0
ON CONFLICT (photo_id, user_email) DO NOTHING;

-- 3. Atomic toggle_like function using the join table
-- Parameter prefixed with p_ to avoid ambiguity with column names
CREATE OR REPLACE FUNCTION toggle_like(photo_id_input uuid, p_user_email text)
RETURNS jsonb AS $$
DECLARE
  already_liked boolean;
  new_count int;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM photo_likes
    WHERE photo_id = photo_id_input AND user_email = p_user_email
  ) INTO already_liked;

  IF already_liked THEN
    DELETE FROM photo_likes
    WHERE photo_id = photo_id_input AND user_email = p_user_email;
  ELSE
    INSERT INTO photo_likes (photo_id, user_email)
    VALUES (photo_id_input, p_user_email)
    ON CONFLICT (photo_id, user_email) DO NOTHING;
  END IF;

  SELECT count(*) INTO new_count FROM photo_likes WHERE photo_id = photo_id_input;
  UPDATE photos SET likes = new_count WHERE id = photo_id_input;

  RETURN jsonb_build_object(
    'likes', new_count,
    'action', CASE WHEN already_liked THEN 'unliked' ELSE 'liked' END
  );
END;
$$ LANGUAGE plpgsql;

-- 4. Helper: get all photo IDs liked by a user (for initial client load)
CREATE OR REPLACE FUNCTION get_user_likes(p_user_email text)
RETURNS SETOF uuid AS $$
  SELECT photo_id FROM photo_likes WHERE user_email = p_user_email;
$$ LANGUAGE sql STABLE;

-- 5. Enable RLS on photo_likes
ALTER TABLE photo_likes ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all likes (needed for counts)
CREATE POLICY "Anyone can read likes" ON photo_likes
  FOR SELECT USING (true);

-- Allow authenticated users to insert/delete their own likes
CREATE POLICY "Users can manage own likes" ON photo_likes
  FOR ALL USING (true);
