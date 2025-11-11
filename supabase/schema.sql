-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Rooms table
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(10) UNIQUE NOT NULL,
  config JSONB DEFAULT '{"colors": ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8"]}'::jsonb,
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
