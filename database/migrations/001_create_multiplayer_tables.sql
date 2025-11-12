-- Drop existing tables and constraints if they exist
DROP TABLE IF EXISTS public.team_players CASCADE;
DROP TABLE IF EXISTS public.auction_bids CASCADE;
DROP TABLE IF EXISTS public.rooms CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Create rooms table for multiplayer auction
CREATE TABLE public.rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(10) UNIQUE NOT NULL,
  host_username VARCHAR(255) NOT NULL,
  players JSONB DEFAULT '[]'::jsonb,
  status VARCHAR(50) DEFAULT 'waiting' CHECK (status IN ('waiting', 'auction_started', 'bidding_ready', 'finished')),
  auction_teams JSONB,
  auction_players JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  CONSTRAINT room_code_length CHECK (char_length(code) = 6)
);

-- Create auction_bids table to track all bids
CREATE TABLE public.auction_bids (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL,
  team_id VARCHAR(255) NOT NULL,
  player_id VARCHAR(255) NOT NULL,
  bid_amount BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create team_players table to track player assignments
CREATE TABLE public.team_players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL,
  team_id VARCHAR(255) NOT NULL,
  player_id VARCHAR(255) NOT NULL,
  purchase_price BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  UNIQUE(room_id, team_id, player_id)
);

-- Add foreign key constraints after all tables are created
ALTER TABLE public.auction_bids
  ADD CONSTRAINT fk_auction_bids_room_id
  FOREIGN KEY (room_id) REFERENCES public.rooms(id) ON DELETE CASCADE;

ALTER TABLE public.team_players
  ADD CONSTRAINT fk_team_players_room_id
  FOREIGN KEY (room_id) REFERENCES public.rooms(id) ON DELETE CASCADE;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_rooms_code ON public.rooms(code);
CREATE INDEX IF NOT EXISTS idx_rooms_host_username ON public.rooms(host_username);
CREATE INDEX IF NOT EXISTS idx_auction_bids_room_id ON public.auction_bids(room_id);
CREATE INDEX IF NOT EXISTS idx_auction_bids_team_id ON public.auction_bids(team_id);
CREATE INDEX IF NOT EXISTS idx_team_players_room_id ON public.team_players(room_id);
CREATE INDEX IF NOT EXISTS idx_team_players_team_id ON public.team_players(team_id);

-- Enable Row Level Security
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auction_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_players ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow read rooms" ON public.rooms;
DROP POLICY IF EXISTS "Allow insert rooms" ON public.rooms;
DROP POLICY IF EXISTS "Allow update rooms" ON public.rooms;
DROP POLICY IF EXISTS "Allow delete rooms" ON public.rooms;
DROP POLICY IF EXISTS "Allow read bids" ON public.auction_bids;
DROP POLICY IF EXISTS "Allow insert bids" ON public.auction_bids;
DROP POLICY IF EXISTS "Allow read team_players" ON public.team_players;
DROP POLICY IF EXISTS "Allow insert team_players" ON public.team_players;

-- Create RLS policies for rooms (allow anonymous read/write for room codes)
CREATE POLICY "Allow read rooms" ON public.rooms
  FOR SELECT USING (true);

CREATE POLICY "Allow insert rooms" ON public.rooms
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update rooms" ON public.rooms
  FOR UPDATE USING (true);

CREATE POLICY "Allow delete rooms" ON public.rooms
  FOR DELETE USING (true);

-- Create RLS policies for auction_bids
CREATE POLICY "Allow read bids" ON public.auction_bids
  FOR SELECT USING (true);

CREATE POLICY "Allow insert bids" ON public.auction_bids
  FOR INSERT WITH CHECK (true);

-- Create RLS policies for team_players
CREATE POLICY "Allow read team_players" ON public.team_players
  FOR SELECT USING (true);

CREATE POLICY "Allow insert team_players" ON public.team_players
  FOR INSERT WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_rooms_updated_at ON public.rooms;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_rooms_updated_at
BEFORE UPDATE ON public.rooms
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Add auction_players column if it doesn't exist
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS auction_players JSONB;

-- Add auction_state column for real-time bid synchronization
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS auction_state JSONB;

-- Update status constraint to include bidding_ready
ALTER TABLE public.rooms DROP CONSTRAINT IF EXISTS rooms_status_check;
ALTER TABLE public.rooms ADD CONSTRAINT rooms_status_check CHECK (status IN ('waiting', 'auction_started', 'bidding_ready', 'finished'));