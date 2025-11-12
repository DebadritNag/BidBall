import { supabase } from './supabaseClient';
import { AuctionStatus } from '../types';

export const auctionService = {
  async createAuction(playerId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('auctions')
      .insert([
        {
          player_id: playerId,
          current_bid: 0,
          status: 'pre-auction',
        },
      ])
      .select();

    if (error) {
      console.error('Error creating auction:', error);
      throw error;
    }

    return data?.[0]?.id || null;
  },

  async fetchAuctionById(id: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('auctions')
      .select(`
        *,
        players(*),
        teams(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching auction:', error);
      return null;
    }

    return data;
  },

  async updateAuctionStatus(auctionId: string, status: AuctionStatus): Promise<boolean> {
    const { error } = await supabase
      .from('auctions')
      .update({ 
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', auctionId);

    if (error) {
      console.error('Error updating auction status:', error);
      return false;
    }

    return true;
  },

  async updateAuctionBid(auctionId: string, currentBid: number, winningTeamId?: string): Promise<boolean> {
    const { error } = await supabase
      .from('auctions')
      .update({ 
        current_bid: currentBid,
        winning_team_id: winningTeamId || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', auctionId);

    if (error) {
      console.error('Error updating auction bid:', error);
      return false;
    }

    return true;
  },

  async finalizeAuction(auctionId: string, status: 'sold' | 'unsold', winningTeamId?: string): Promise<boolean> {
    const { error } = await supabase
      .from('auctions')
      .update({
        status,
        winning_team_id: winningTeamId || null,
        ended_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', auctionId);

    if (error) {
      console.error('Error finalizing auction:', error);
      return false;
    }

    return true;
  },

  async fetchAllAuctions(limit?: number): Promise<any[]> {
    let query = supabase
      .from('auctions')
      .select(`
        *,
        players(*),
        teams(*)
      `);

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching auctions:', error);
      return [];
    }

    return data || [];
  },
};
