-- Table comments
CREATE TABLE IF NOT EXISTS comments (
  id BIGSERIAL PRIMARY KEY,
  photo_id UUID NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  created_by TEXT NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) <= 500),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour fetch rapide par photo
CREATE INDEX IF NOT EXISTS comments_photo_id_idx ON comments(photo_id);

-- RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comments_select" ON comments FOR SELECT USING (true);
CREATE POLICY "comments_insert" ON comments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "comments_delete" ON comments FOR DELETE USING (
  created_by = (
    SELECT full_name FROM guests WHERE user_id = auth.uid() LIMIT 1
  )
);

-- Compteur dénormalisé sur photos
ALTER TABLE photos ADD COLUMN IF NOT EXISTS comments_count INT DEFAULT 0;

CREATE OR REPLACE FUNCTION update_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE photos SET comments_count = comments_count + 1 WHERE id = NEW.photo_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE photos SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = OLD.photo_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS comments_count_trigger ON comments;
CREATE TRIGGER comments_count_trigger
AFTER INSERT OR DELETE ON comments
FOR EACH ROW EXECUTE FUNCTION update_comments_count();
