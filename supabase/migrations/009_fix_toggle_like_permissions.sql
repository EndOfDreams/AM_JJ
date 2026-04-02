-- Migration 009: Fix toggle_like permission issue
-- Problem: toggle_like runs as SECURITY INVOKER (anon role) by default.
-- The UPDATE on the photos table silently fails when RLS is enabled on photos
-- without an UPDATE policy for the anon role.
-- Fix: use SECURITY DEFINER so the function runs as its creator (postgres role)
-- and can always update photos.likes.

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
$$ LANGUAGE plpgsql SECURITY DEFINER;
