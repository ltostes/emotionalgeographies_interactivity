-- Migration: Switch from color-based to image+question-based contributions
-- Run this in Supabase SQL Editor

-- Function to get image statistics for a room
CREATE OR REPLACE FUNCTION get_room_image_stats(p_room_id UUID)
RETURNS TABLE (
  image_id TEXT,
  contribution_count BIGINT,
  mean_valence NUMERIC,
  mean_arousal NUMERIC
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    (c.data->>'image_id')::TEXT as image_id,
    COUNT(c.id) as contribution_count,
    AVG(CASE
      WHEN c.data->>'question_id' = 'valence'
      THEN (c.data->>'answer')::NUMERIC
      ELSE NULL
    END) as mean_valence,
    AVG(CASE
      WHEN c.data->>'question_id' = 'arousal'
      THEN (c.data->>'answer')::NUMERIC
      ELSE NULL
    END) as mean_arousal
  FROM contributions c
  WHERE c.room_id = p_room_id
  GROUP BY (c.data->>'image_id')
  ORDER BY contribution_count DESC;
$$;
