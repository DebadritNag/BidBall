import { supabase } from './supabaseClient';

export const roomService = {
  async createRoom(roomName: string, hostId: string, maxPlayers: number = 8): Promise<string | null> {
    const { data, error } = await supabase
      .from('game_rooms')
      .insert([
        {
          room_name: roomName,
          host_id: hostId,
          max_players: maxPlayers,
          current_players: 1,
          status: 'waiting',
        },
      ])
      .select();

    if (error) {
      console.error('Error creating room:', error);
      throw error;
    }

    return data?.[0]?.id || null;
  },

  async fetchRoomById(id: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('game_rooms')
      .select(`
        *,
        room_players(
          *,
          teams(*)
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching room:', error);
      return null;
    }

    return data;
  },

  async fetchAllRooms(): Promise<any[]> {
    const { data, error } = await supabase
      .from('game_rooms')
      .select('*')
      .eq('status', 'waiting')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching rooms:', error);
      return [];
    }

    return data || [];
  },

  async joinRoom(roomId: string, teamId: string): Promise<boolean> {
    const { error } = await supabase
      .from('room_players')
      .insert([
        {
          room_id: roomId,
          team_id: teamId,
        },
      ]);

    if (error) {
      console.error('Error joining room:', error);
      return false;
    }

    // Update room's current_players count
    const room = await this.fetchRoomById(roomId);
    if (room) {
      const currentPlayers = room.room_players?.length || 1;
      await supabase
        .from('game_rooms')
        .update({ current_players: currentPlayers })
        .eq('id', roomId);
    }

    return true;
  },

  async leaveRoom(roomId: string, teamId: string): Promise<boolean> {
    const { error } = await supabase
      .from('room_players')
      .delete()
      .eq('room_id', roomId)
      .eq('team_id', teamId);

    if (error) {
      console.error('Error leaving room:', error);
      return false;
    }

    // Update room's current_players count
    const room = await this.fetchRoomById(roomId);
    if (room) {
      const currentPlayers = Math.max(0, (room.room_players?.length || 1) - 1);
      await supabase
        .from('game_rooms')
        .update({ current_players: currentPlayers })
        .eq('id', roomId);
    }

    return true;
  },

  async updateRoomStatus(roomId: string, status: 'waiting' | 'in-progress' | 'finished'): Promise<boolean> {
    const { error } = await supabase
      .from('game_rooms')
      .update({ 
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', roomId);

    if (error) {
      console.error('Error updating room status:', error);
      return false;
    }

    return true;
  },

  async subscribeToRoomUpdates(roomId: string, callback: (room: any) => void) {
    const subscription = supabase
      .channel(`room:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_rooms',
          filter: `id=eq.${roomId}`,
        },
        (payload) => {
          callback(payload.new);
        }
      )
      .subscribe();

    return subscription;
  },
};
