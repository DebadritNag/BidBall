# Database Setup for Real-Time Multiplayer

## Overview
The multiplayer auction system uses Supabase PostgreSQL database with real-time polling to synchronize room state across all players.

## Tables

### 1. `rooms` Table
Stores active auction rooms and their state.

**Columns:**
- `id` (UUID) - Primary key
- `code` (VARCHAR 10) - Unique room code (6 characters)
- `host_username` (VARCHAR 255) - Username of room creator
- `players` (JSONB) - Array of players in the room
- `status` (VARCHAR 50) - Room status: 'waiting', 'auction_started', 'finished'
- `auction_teams` (JSONB) - Teams data during auction
- `created_at` (TIMESTAMP) - Room creation time
- `updated_at` (TIMESTAMP) - Last update time (auto-updated)

### 2. `auction_bids` Table
Stores all bids placed during the auction.

**Columns:**
- `id` (UUID) - Primary key
- `room_code` (VARCHAR 10) - Reference to room code
- `team_id` (VARCHAR 255) - Team making the bid
- `player_id` (VARCHAR 255) - Player being bid on
- `bid_amount` (BIGINT) - Bid amount in rupees
- `created_at` (TIMESTAMP) - Bid timestamp

### 3. `team_players` Table
Stores final player assignments to teams after winning bids.

**Columns:**
- `id` (UUID) - Primary key
- `room_code` (VARCHAR 10) - Reference to room code
- `team_id` (VARCHAR 255) - Team ID
- `player_id` (VARCHAR 255) - Player ID
- `purchase_price` (BIGINT) - Final purchase price
- `created_at` (TIMESTAMP) - Assignment timestamp

## Setup Instructions

### Step 1: Run the Migration
Execute the SQL in `database/migrations/001_create_multiplayer_tables.sql` in your Supabase SQL editor:

1. Go to Supabase Dashboard → Your Project → SQL Editor
2. Click "New Query"
3. Copy and paste the entire SQL migration script
4. Click "Run"

### Step 2: Verify Tables
Check that all tables were created:
- Go to Database → Tables in Supabase dashboard
- You should see: `rooms`, `auction_bids`, `team_players`

### Step 3: Configure Environment Variables
Add to your `.env.local`:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Step 4: Test the Connection
The app will automatically use `multiplayerService` for:
- Creating rooms
- Joining rooms
- Syncing player list
- Starting auctions
- Recording bids

## Real-Time Synchronization

### How It Works
1. **Polling-based sync**: Every 500ms, clients fetch the latest room state from the database
2. **Room updates**: When any player joins/leaves, the `updated_at` timestamp is updated
3. **Auction start**: Host triggers auction by updating room `status` to `auction_started`
4. **All clients detect**: Other clients see the status change on next poll cycle (~500ms delay)

### Data Flow
```
Host creates room → Database stores room
Player joins → Adds to players array in database
Host selects team → Updates locally
Host starts auction → Updates room status to 'auction_started'
All players detect → Poll detects status change, redirects to auction
```

## Performance Notes

- **Polling interval**: 500ms (configurable in RoomLobby.tsx)
- **Database indexes**: Created on commonly queried fields (code, host_username, room_code, team_id)
- **RLS policies**: All operations allowed (adjust for production security)

## Future Improvements

For production, consider:
1. **WebSocket**: Replace polling with Supabase Realtime subscriptions for instant updates
2. **Authentication**: Use Supabase Auth to secure room access
3. **Better RLS**: Restrict operations based on user authentication
4. **Cleanup cron**: Delete old finished rooms automatically
5. **Bid synchronization**: Broadcast bids to all players in real-time

## Troubleshooting

### Room not found
- Ensure room code is exactly 6 characters
- Check that room exists in `rooms` table

### Players not appearing
- Check `updated_at` timestamp is recent
- Verify polling interval in RoomLobby.tsx
- Check browser console for errors

### Auction not starting
- Ensure host has selected a team
- Verify `auction_teams` data is properly formatted
- Check database for auction_started status

### Connection issues
- Verify Supabase URL and key are correct
- Check Supabase project is running
- Look for CORS errors in browser console
