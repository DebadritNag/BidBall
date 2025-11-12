export interface Player {
  id: string;
  name: string;
  nationality: string;
  position: 'Goalkeeper' | 'Defender' | 'Midfielder' | 'Forward';
  rating: number;
  basePrice: number;
}

export interface Team {
  id: string;
  name: string;
  logo: string;
  budget: number;
  players: Player[];
  isAI: boolean;
  isUser: boolean;
}

export interface Bid {
  teamId: string;
  amount: number;
}

export type AuctionStatus = 'pre-auction' | 'bidding' | 'sold' | 'unsold' | 'finished' | 're-auction';

export type GameState = 'landing' | 'signup' | 'lobby' | 'auction' | 'summary' | 'multiplayer-home' | 'room-lobby';

export interface AuctioneerContext {
    eventType: 'NEW_PLAYER' | 'BID_PLACED' | 'TIMER_LOW' | 'PLAYER_SOLD' | 'PLAYER_UNSOLD' | 'AUCTION_START';
    playerName?: string;
    basePrice?: number;
    bidAmount?: number;
    teamName?: string;
}

export interface ChatMessage {
  sender: string;
  text: string;
  isUser: boolean;
}

// Supabase User Type
export interface AuthUser {
  id: string;
  email?: string;
  user_metadata?: {
    username?: string;
  };
}

// Supabase Profile Type
export interface UserProfile {
  id: string;
  email: string;
  username?: string;
  created_at: string;
  updated_at: string;
}

// Supabase Session Type
export interface AuthSession {
  user: AuthUser | null;
  access_token: string | null;
  refresh_token: string | null;
}
