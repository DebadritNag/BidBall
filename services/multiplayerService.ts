import { supabase } from './supabaseClient';

interface RoomPlayer {
  username: string;
  isHost: boolean;
  teamId?: string;
  teamName?: string;
}

interface Room {
  id: string;
  code: string;
  host_username: string;
  players: RoomPlayer[];
  status: 'waiting' | 'auction_started' | 'finished';
  auction_teams?: any[];
  created_at: string;
  updated_at: string;
}

export const multiplayerService = {
  // Create a new room
  createRoom: async (roomCode: string, hostUsername: string): Promise<Room | null> => {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .insert([
          {
            code: roomCode,
            host_username: hostUsername,
            players: [{ username: hostUsername, isHost: true }],
            status: 'waiting',
          }
        ])
        .select()
        .single();

      if (error) throw error;
      return data as Room;
    } catch (error) {
      console.error('Error creating room:', error);
      return null;
    }
  },

  // Get room by code
  getRoomByCode: async (roomCode: string): Promise<Room | null> => {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('code', roomCode)
        .single();

      if (error) throw error;
      return data as Room;
    } catch (error) {
      console.error('Error fetching room:', error);
      return null;
    }
  },

  // Add player to room
  addPlayerToRoom: async (roomCode: string, username: string): Promise<Room | null> => {
    try {
      const room = await multiplayerService.getRoomByCode(roomCode);
      if (!room) return null;

      // Check if player already exists
      const playerExists = room.players.some(p => p.username === username);
      if (playerExists) return room;

      // Add new player
      const updatedPlayers = [...room.players, { username, isHost: false }];
      
      const { data, error } = await supabase
        .from('rooms')
        .update({ players: updatedPlayers, updated_at: new Date().toISOString() })
        .eq('code', roomCode)
        .select()
        .single();

      if (error) throw error;
      return data as Room;
    } catch (error) {
      console.error('Error adding player to room:', error);
      return null;
    }
  },

  // Remove player from room
  removePlayerFromRoom: async (roomCode: string, username: string): Promise<void> => {
    try {
      const room = await multiplayerService.getRoomByCode(roomCode);
      if (!room) return;

      const updatedPlayers = room.players.filter(p => p.username !== username);
      
      if (updatedPlayers.length === 0) {
        // Delete room if no players left
        await supabase.from('rooms').delete().eq('code', roomCode);
      } else {
        // Update room with remaining players
        await supabase
          .from('rooms')
          .update({ players: updatedPlayers, updated_at: new Date().toISOString() })
          .eq('code', roomCode);
      }
    } catch (error) {
      console.error('Error removing player from room:', error);
    }
  },

  // Start auction
  startAuction: async (roomCode: string, teams: any[]): Promise<Room | null> => {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .update({
          status: 'auction_started',
          auction_teams: teams,
          updated_at: new Date().toISOString()
        })
        .eq('code', roomCode)
        .select()
        .single();

      if (error) throw error;
      return data as Room;
    } catch (error) {
      console.error('Error starting auction:', error);
      return null;
    }
  },

  // End auction
  endAuction: async (roomCode: string, teams: any[]): Promise<Room | null> => {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .update({
          status: 'finished',
          auction_teams: teams,
          updated_at: new Date().toISOString()
        })
        .eq('code', roomCode)
        .select()
        .single();

      if (error) throw error;
      return data as Room;
    } catch (error) {
      console.error('Error ending auction:', error);
      return null;
    }
  },

  // Subscribe to room changes (real-time)
  subscribeToRoom: (roomCode: string, callback: (room: Room) => void) => {
    const subscription = supabase
      .from(`rooms:code=eq.${roomCode}`)
      .on('*', (payload) => {
        if (payload.new) {
          callback(payload.new as Room);
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  },

  // Save bid to database
  saveBid: async (roomId: string, teamId: string, playerId: string, amount: number): Promise<void> => {
    try {
      await supabase
        .from('auction_bids')
        .insert([
          {
            room_id: roomId,
            team_id: teamId,
            player_id: playerId,
            bid_amount: amount,
          }
        ]);
    } catch (error) {
      console.error('Error saving bid:', error);
    }
  },

  // Save player assignment
  assignPlayerToTeam: async (roomId: string, teamId: string, playerId: string, amount: number): Promise<void> => {
    try {
      await supabase
        .from('team_players')
        .insert([
          {
            room_id: roomId,
            team_id: teamId,
            player_id: playerId,
            purchase_price: amount,
          }
        ]);
    } catch (error) {
      console.error('Error assigning player to team:', error);
    }
  },

  // Get auction bids for a room
  getAuctionBids: async (roomId: string): Promise<any[]> => {
    try {
      const { data, error } = await supabase
        .from('auction_bids')
        .select('*')
        .eq('room_id', roomId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching bids:', error);
      return [];
    }
  },
};
