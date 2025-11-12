import { Team } from './types';

export const INITIAL_BUDGET = 10000000; // 1 Crore
export const BID_INCREMENT = 50000; // 0.5 Lakh
export const BIDDING_TIME = 8; // seconds
export const POST_SALE_DELAY = 4000; // ms
export const MIN_TEAM_PLAYERS = 11;
export const MAX_TEAM_PLAYERS = 20;

export const TEAMS: Omit<Team, 'isAI' | 'isUser' | 'players' | 'budget'>[] = [
  { id: 't1', name: 'Mumbai Mavericks', logo: 'https://img.icons8.com/plasticine/100/m.png' },
  { id: 't2', name: 'Delhi Dynamos', logo: 'https://img.icons8.com/plasticine/100/d.png' },
  { id: 't3', name: 'Kolkata Knights', logo: 'https://img.icons8.com/plasticine/100/k.png' },
  { id: 't4', name: 'Chennai Champions', logo: 'https://img.icons8.com/plasticine/100/c.png' },
];

export const AUCTION_CHAT_MESSAGES = [
    "This player is a must-have!",
    "I'm saving my budget for a defender.",
    "That's a bold opening bid.",
    "Good buy for that price.",
    "He's going for more than I expected.",
    "I'm out on this one.",
    "Let's see if a bidding war starts."
];
