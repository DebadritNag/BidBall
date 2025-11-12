-- Users/Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Teams table
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  logo TEXT,
  budget NUMERIC NOT NULL DEFAULT 100000,
  remaining_budget NUMERIC NOT NULL DEFAULT 100000,
  is_ai BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Players table
CREATE TABLE public.players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  nationality TEXT,
  position TEXT NOT NULL CHECK (position IN ('Goalkeeper', 'Defender', 'Midfielder', 'Forward')),
  rating NUMERIC NOT NULL,
  base_price NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Team Players (Junction table for Many-to-Many relationship)
CREATE TABLE public.team_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  sold_price NUMERIC NOT NULL,
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(team_id, player_id)
);

-- Auctions table
CREATE TABLE public.auctions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  current_bid NUMERIC NOT NULL,
  winning_team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pre-auction' CHECK (status IN ('pre-auction', 'bidding', 'sold', 'unsold', 'finished')),
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Bids table
CREATE TABLE public.bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id UUID NOT NULL REFERENCES public.auctions(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Chat Messages table
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  sender_name TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Game Rooms table (for multiplayer)
CREATE TABLE public.game_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_name TEXT NOT NULL,
  host_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  max_players INTEGER DEFAULT 8,
  current_players INTEGER DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'in-progress', 'finished')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Room Players (Junction table)
CREATE TABLE public.room_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.game_rooms(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(room_id, team_id)
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_players ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for Teams
CREATE POLICY "Users can view their own teams" ON public.teams
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own teams" ON public.teams
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own teams" ON public.teams
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for Players (Public read)
CREATE POLICY "Anyone can view players" ON public.players
  FOR SELECT USING (true);

-- RLS Policies for Team Players
CREATE POLICY "Users can view their team players" ON public.team_players
  FOR SELECT USING (
    team_id IN (
      SELECT id FROM public.teams WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for Auctions (Public read)
CREATE POLICY "Anyone can view auctions" ON public.auctions
  FOR SELECT USING (true);

-- RLS Policies for Bids
CREATE POLICY "Users can view bids in their auctions" ON public.bids
  FOR SELECT USING (
    auction_id IN (
      SELECT id FROM public.auctions WHERE winning_team_id IN (
        SELECT id FROM public.teams WHERE user_id = auth.uid()
      )
    )
  );

-- RLS Policies for Chat Messages
CREATE POLICY "Anyone can view chat messages" ON public.chat_messages
  FOR SELECT USING (true);

CREATE POLICY "Users can insert chat messages" ON public.chat_messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- RLS Policies for Game Rooms
CREATE POLICY "Anyone can view game rooms" ON public.game_rooms
  FOR SELECT USING (true);

CREATE POLICY "Users can create game rooms" ON public.game_rooms
  FOR INSERT WITH CHECK (auth.uid() = host_id);

-- RLS Policies for Room Players
CREATE POLICY "Anyone can view room players" ON public.room_players
  FOR SELECT USING (true);

-- Create indexes for better performance
CREATE INDEX idx_teams_user_id ON public.teams(user_id);
CREATE INDEX idx_team_players_team_id ON public.team_players(team_id);
CREATE INDEX idx_team_players_player_id ON public.team_players(player_id);
CREATE INDEX idx_auctions_player_id ON public.auctions(player_id);
CREATE INDEX idx_auctions_winning_team_id ON public.auctions(winning_team_id);
CREATE INDEX idx_auctions_status ON public.auctions(status);
CREATE INDEX idx_bids_auction_id ON public.bids(auction_id);
CREATE INDEX idx_bids_team_id ON public.bids(team_id);
CREATE INDEX idx_chat_messages_room_id ON public.chat_messages(room_id);
CREATE INDEX idx_chat_messages_created_at ON public.chat_messages(created_at);
CREATE INDEX idx_game_rooms_host_id ON public.game_rooms(host_id);
CREATE INDEX idx_room_players_room_id ON public.room_players(room_id);
