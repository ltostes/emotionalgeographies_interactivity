-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Rooms table
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(10) UNIQUE NOT NULL,
  config JSONB DEFAULT '{}'::jsonb,
  creator_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster room code lookups
CREATE INDEX idx_rooms_code ON rooms(code);
CREATE INDEX idx_rooms_creator ON rooms(creator_user_id);

-- Contributions table
CREATE TABLE contributions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  identifier VARCHAR(255) NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for faster queries
CREATE INDEX idx_contributions_room ON contributions(room_id);
CREATE INDEX idx_contributions_identifier ON contributions(room_id, identifier);

-- Enable Row Level Security
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rooms
-- Creators can read their own rooms
CREATE POLICY "Users can read own rooms" ON rooms
  FOR SELECT
  USING (auth.uid() = creator_user_id);

-- Anyone can read rooms (needed for audience to access room config)
CREATE POLICY "Anyone can read rooms" ON rooms
  FOR SELECT
  USING (true);

-- Creators can insert their own rooms
CREATE POLICY "Users can create rooms" ON rooms
  FOR INSERT
  WITH CHECK (auth.uid() = creator_user_id);

-- Creators can update their own rooms
CREATE POLICY "Users can update own rooms" ON rooms
  FOR UPDATE
  USING (auth.uid() = creator_user_id);

-- RLS Policies for contributions
-- Anyone can read contributions for a room (needed for presenter view)
CREATE POLICY "Anyone can read contributions" ON contributions
  FOR SELECT
  USING (true);

-- Anyone can insert contributions (audience doesn't need auth)
CREATE POLICY "Anyone can insert contributions" ON contributions
  FOR INSERT
  WITH CHECK (true);

-- Enable realtime for contributions table
ALTER PUBLICATION supabase_realtime ADD TABLE contributions;

-- Function to get user's rooms with contribution counts
CREATE OR REPLACE FUNCTION get_user_rooms_with_counts()
RETURNS TABLE (
  id UUID,
  code VARCHAR,
  config JSONB,
  creator_user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE,
  contribution_count BIGINT
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    r.id,
    r.code,
    r.config,
    r.creator_user_id,
    r.created_at,
    COALESCE(COUNT(c.id), 0) as contribution_count
  FROM rooms r
  LEFT JOIN contributions c ON r.id = c.room_id
  WHERE r.creator_user_id = auth.uid()
  GROUP BY r.id
  ORDER BY DATE(r.created_at) DESC, contribution_count DESC;
$$;

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
