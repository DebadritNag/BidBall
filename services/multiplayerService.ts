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
      console.log('createRoom response:', data);
      if (data) {
        // Ensure players is properly formatted
        if (data.players && typeof data.players === 'string') {
          try {
            data.players = JSON.parse(data.players);
          } catch (e) {
            console.error('Failed to parse players:', e);
            data.players = [];
          }
        } else if (!Array.isArray(data.players)) {
          data.players = [];
        }
      }
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
      if (data) {
        console.log('getRoomByCode raw data:', data);
        // Ensure players is properly formatted
        if (data.players && typeof data.players === 'string') {
          try {
            data.players = JSON.parse(data.players);
          } catch (e) {
            console.error('Failed to parse players:', e);
            data.players = [];
          }
        } else if (!Array.isArray(data.players)) {
          data.players = [];
        }
        console.log('getRoomByCode formatted data:', data);
      }
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

      // Ensure players is an array
      const currentPlayers = Array.isArray(room.players) ? room.players : [];
      
      // Check if player already exists
      const playerExists = currentPlayers.some((p: any) => p.username === username);
      if (playerExists) return room;

      // Add new player
      const updatedPlayers = [...currentPlayers, { username, isHost: false }];
      
      const { data, error } = await supabase
        .from('rooms')
        .update({ players: updatedPlayers, updated_at: new Date().toISOString() })
        .eq('code', roomCode)
        .select()
        .single();

      if (error) throw error;
      if (data) {
        // Ensure players is properly formatted
        if (data.players && typeof data.players === 'string') {
          try {
            data.players = JSON.parse(data.players);
          } catch (e) {
            console.error('Failed to parse players:', e);
            data.players = [];
          }
        } else if (!Array.isArray(data.players)) {
          data.players = [];
        }
        console.log('addPlayerToRoom response:', data);
      }
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

      // Ensure players is an array
      const currentPlayers = Array.isArray(room.players) ? room.players : [];
      const updatedPlayers = currentPlayers.filter((p: any) => p.username !== username);
      
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
      if (data) {
        // Ensure players is properly formatted
        if (data.players && typeof data.players === 'string') {
          try {
            data.players = JSON.parse(data.players);
          } catch (e) {
            console.error('Failed to parse players:', e);
            data.players = [];
          }
        } else if (!Array.isArray(data.players)) {
          data.players = [];
        }
      }
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

  // Subscribe to real-time room changes using new API
  subscribeToRoomChanges: (roomCode: string, callback: (room: Room) => void) => {
    console.log('Subscribing to real-time room changes for:', roomCode);
    
    const channel = supabase
      .channel(`room-${roomCode}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rooms',
          filter: `code=eq.${roomCode}`
        },
        async (payload) => {
          console.log('Real-time update received:', payload);
          if (payload.new) {
            const data = payload.new as any;
            // Ensure players is properly formatted
            if (data.players && typeof data.players === 'string') {
              try {
                data.players = JSON.parse(data.players);
              } catch (e) {
                console.error('Failed to parse players:', e);
                data.players = [];
              }
            } else if (!Array.isArray(data.players)) {
              data.players = [];
            }
            console.log('Formatted room data:', data);
            callback(data as Room);
          }
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    return () => {
      console.log('Unsubscribing from room changes for:', roomCode);
      supabase.removeChannel(channel);
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
