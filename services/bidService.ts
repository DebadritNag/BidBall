import { supabase } from './supabaseClient';
import { Bid } from '../types';

export const bidService = {
  async placeBid(auctionId: string, teamId: string, amount: number): Promise<boolean> {
    const { error } = await supabase
      .from('bids')
      .insert([
        {
          auction_id: auctionId,
          team_id: teamId,
          amount,
        },
      ]);

    if (error) {
      console.error('Error placing bid:', error);
      return false;
    }

    return true;
  },

  async fetchBidsByAuction(auctionId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('bids')
      .select(`
        *,
        teams(*),
        auctions(*)
      `)
      .eq('auction_id', auctionId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching bids:', error);
      return [];
    }

    return data || [];
  },

  async fetchHighestBid(auctionId: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('bids')
      .select('*')
      .eq('auction_id', auctionId)
      .order('amount', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('Error fetching highest bid:', error);
      return null;
    }

    return data;
  },

  async fetchBidsByTeam(teamId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('bids')
      .select(`
        *,
        auctions(*)
      `)
      .eq('team_id', teamId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching team bids:', error);
      return [];
    }

    return data || [];
  },
};
