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
      console.log('Creating room with code:', roomCode, 'and host:', hostUsername);
      
      // Check if Supabase is configured
      if (!supabase || !supabase.from) {
        console.error('Supabase not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
        return null;
      }
      
      const roomData = {
        code: roomCode,
        host_username: hostUsername,
        players: [{ username: hostUsername, isHost: true }],
        status: 'waiting',
      };
      
      console.log('Room data to insert:', roomData);
      
      // First, try to insert the room
      const { data: insertData, error: insertError } = await supabase
        .from('rooms')
        .insert([roomData])
        .select()
        .single();

      if (insertError) {
        console.error('Supabase error on insert:', insertError);
        console.error('Error code:', insertError.code);
        console.error('Error message:', insertError.message);
        console.error('Error details:', insertError.details);
        // Don't throw, try to fetch the room instead (it might have been created)
      } else if (insertData) {
        console.log('createRoom insert success:', insertData);
        // Format and return
        if (insertData.players && typeof insertData.players === 'string') {
          try {
            insertData.players = JSON.parse(insertData.players);
          } catch (e) {
            console.error('Failed to parse players:', e);
            insertData.players = [];
          }
        } else if (!Array.isArray(insertData.players)) {
          insertData.players = [];
        }
        return insertData as Room;
      }
      
      // Fallback: try insert without select
      console.log('Trying insert without select...');
      const { error: insertError2 } = await supabase
        .from('rooms')
        .insert([roomData]);
      
      if (insertError2) {
        console.error('Insert without select also failed:', insertError2);
        console.error('Error code:', insertError2.code);
        console.error('Error message:', insertError2.message);
      } else {
        console.log('Insert succeeded without select');
      }
      
      // Final fallback: fetch the room to confirm it was created
      console.log('Fetching created room as final fallback...');
      const room = await multiplayerService.getRoomByCode(roomCode);
      if (room) {
        console.log('Room found after creation:', room);
        return room;
      }
      
      console.error('Failed to create or retrieve room');
      return null;
    } catch (error) {
      console.error('Error creating room (caught exception):', error);
      return null;
    }
  },

  // Get room by code
  getRoomByCode: async (roomCode: string): Promise<Room | null> => {
    try {
      console.log('Fetching room by code:', roomCode);
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('code', roomCode)
        .single();

      if (error) {
        console.error('Supabase error fetching room:', error);
        console.error('Error details:', error.code, error.message, error.details);
        if (error.code === 'PGRST116') {
          console.error('Room not found in database');
        }
        throw error;
      }
      if (data) {
        console.log('getRoomByCode raw data:', data);
        console.log('getRoomByCode raw players type:', typeof data.players, 'value:', data.players);
        // Ensure players is properly formatted
        if (data.players && typeof data.players === 'string') {
          try {
            data.players = JSON.parse(data.players);
            console.log('Parsed players from string:', data.players);
          } catch (e) {
            console.error('Failed to parse players:', e);
            data.players = [];
          }
        } else if (data.players === null || data.players === undefined) {
          console.log('Players is null/undefined, setting to empty array');
          data.players = [];
        } else if (!Array.isArray(data.players)) {
          console.log('Players is not array, type:', typeof data.players, 'converting...');
          data.players = [];
        }
        console.log('getRoomByCode formatted data:', data, 'players count:', data.players.length);
      }
      return data as Room;
    } catch (error: any) {
      console.error('Error fetching room:', error);
      if (error?.message?.includes('relation "public.rooms" does not exist')) {
        console.error('Database tables not created. Run migration in Supabase SQL Editor.');
      }
      return null;
    }
  },

  // Add player to room
  addPlayerToRoom: async (roomCode: string, username: string): Promise<Room | null> => {
    try {
      console.log('Adding player to room:', roomCode, 'player:', username);
      const room = await multiplayerService.getRoomByCode(roomCode);
      if (!room) {
        console.error('Room not found:', roomCode);
        return null;
      }

      // Ensure players is an array
      const currentPlayers = Array.isArray(room.players) ? room.players : [];
      
      // Check if player already exists
      const playerExists = currentPlayers.some((p: any) => p.username === username);
      if (playerExists) {
        console.log('Player already in room:', username);
        return room;
      }

      // Add new player
      const updatedPlayers = [...currentPlayers, { username, isHost: false }];
      console.log('Updated players array:', updatedPlayers);
      
      const { data, error } = await supabase
        .from('rooms')
        .update({ players: updatedPlayers, updated_at: new Date().toISOString() })
        .eq('code', roomCode)
        .select()
        .single();

      if (error) {
        console.error('Supabase error adding player:', error);
        console.error('Error details:', error.code, error.message, error.details);
        throw error;
      }
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
    } catch (error: any) {
      console.error('Error adding player to room:', error);
      if (error?.message?.includes('relation "public.rooms" does not exist')) {
        console.error('Database tables not created. Run migration in Supabase SQL Editor.');
      }
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
      console.log('Starting auction with teams:', teams);
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

      if (error) {
        console.error('Supabase error starting auction:', error);
        throw error;
      }
      
      console.log('Auction started, response:', data);
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
        // Ensure auction_teams is properly formatted
        if (data.auction_teams && typeof data.auction_teams === 'string') {
          try {
            data.auction_teams = JSON.parse(data.auction_teams);
          } catch (e) {
            console.error('Failed to parse auction_teams:', e);
            data.auction_teams = [];
          }
        }
      }
      return data as Room;
    } catch (error: any) {
      console.error('Error starting auction:', error);
      if (error?.message?.includes('relation "public.rooms" does not exist')) {
        console.error('Database tables not created. Run migration in Supabase SQL Editor.');
      }
      return null;
    }
  },

  // Update room with bidding status (track who's ready to start)
  updateBiddingStatus: async (roomCode: string, username: string, isReady: boolean): Promise<Room | null> => {
    try {
      const room = await multiplayerService.getRoomByCode(roomCode);
      if (!room) return null;

      // Update player's ready status
      const updatedPlayers = Array.isArray(room.players) ? room.players.map((p: any) => 
        p.username === username ? { ...p, isReady } : p
      ) : [];

      const { data, error } = await supabase
        .from('rooms')
        .update({ 
          players: updatedPlayers,
          updated_at: new Date().toISOString()
        })
        .eq('code', roomCode)
        .select()
        .single();

      if (error) throw error;
      
      if (data) {
        if (data.players && typeof data.players === 'string') {
          data.players = JSON.parse(data.players);
        }
      }
      return data as Room;
    } catch (error) {
      console.error('Error updating bidding status:', error);
      return null;
    }
  },

  // Initialize shuffled players and store in room
  initializeAuctionPlayers: async (roomCode: string, shuffledPlayers: any[]): Promise<Room | null> => {
    try {
      console.log('Storing shuffled players in room:', shuffledPlayers.length);
      const { data, error } = await supabase
        .from('rooms')
        .update({ 
          auction_players: shuffledPlayers,
          updated_at: new Date().toISOString()
        })
        .eq('code', roomCode)
        .select()
        .single();

      if (error) throw error;
      return data as Room;
    } catch (error) {
      console.error('Error initializing auction players:', error);
      return null;
    }
  },

  // Update current auction state (current player, bids, etc.)
  updateAuctionState: async (roomCode: string, auctionState: any): Promise<Room | null> => {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .update({ 
          auction_state: auctionState,
          updated_at: new Date().toISOString()
        })
        .eq('code', roomCode)
        .select()
        .single();

      if (error) throw error;
      return data as Room;
    } catch (error) {
      console.error('Error updating auction state:', error);
      return null;
    }
  },

  // Subscribe to auction state changes
  subscribeToAuctionState: (roomCode: string, callback: (auctionState: any) => void) => {
    let isSubscribed = true;
    
    const channel = supabase
      .channel(`auction-${roomCode}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rooms',
          filter: `code=eq.${roomCode}`
        },
        async (payload) => {
          if (payload.new && isSubscribed) {
            const data = payload.new as any;
            if (data.auction_state) {
              callback(data.auction_state);
            }
          }
        }
      )
      .subscribe();

    return () => {
      isSubscribed = false;
      supabase.removeChannel(channel);
    };
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

  // Subscribe to real-time room changes using new API
  subscribeToRoomChanges: (roomCode: string, callback: (room: Room) => void) => {
    console.log('Subscribing to real-time room changes for:', roomCode);
    
    let isSubscribed = true;
    
    // Start with initial fetch
    multiplayerService.getRoomByCode(roomCode).then(room => {
      if (room && isSubscribed) {
        callback(room);
      }
    }).catch(err => console.error('Initial room fetch failed:', err));
    
    // Set up real-time subscription
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
          if (payload.new && isSubscribed) {
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
            // Also ensure auction_teams is properly formatted
            if (data.auction_teams && typeof data.auction_teams === 'string') {
              try {
                data.auction_teams = JSON.parse(data.auction_teams);
              } catch (e) {
                console.error('Failed to parse auction_teams:', e);
                data.auction_teams = [];
              }
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
      isSubscribed = false;
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
