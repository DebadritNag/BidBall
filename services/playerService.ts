import { supabase } from './supabaseClient';
import { Player } from '../types';

export const playerService = {
  async fetchAllPlayers(): Promise<Player[]> {
    const { data, error } = await supabase
      .from('players')
      .select('*');

    if (error) {
      console.error('Error fetching players:', error);
      throw error;
    }

    return data || [];
  },

  async fetchPlayerById(id: string): Promise<Player | null> {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching player:', error);
      return null;
    }

    return data;
  },

  async createPlayer(player: Omit<Player, 'id'>): Promise<Player | null> {
    const { data, error } = await supabase
      .from('players')
      .insert([player])
      .select();

    if (error) {
      console.error('Error creating player:', error);
      throw error;
    }

    return data?.[0] || null;
  },

  async createBulkPlayers(players: Omit<Player, 'id'>[]): Promise<Player[]> {
    const { data, error } = await supabase
      .from('players')
      .insert(players)
      .select();

    if (error) {
      console.error('Error creating bulk players:', error);
      throw error;
    }

    return data || [];
  },
};
