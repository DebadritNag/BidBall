import { supabase } from './supabaseClient';
import { Team } from '../types';

export const teamService = {
  async createTeam(userId: string, team: Omit<Team, 'id' | 'players'>): Promise<Team | null> {
    const { data, error } = await supabase
      .from('teams')
      .insert([
        {
          user_id: userId,
          name: team.name,
          logo: team.logo,
          budget: team.budget,
          remaining_budget: team.budget,
          is_ai: team.isAI,
        },
      ])
      .select();

    if (error) {
      console.error('Error creating team:', error);
      throw error;
    }

    const teamData = data?.[0];
    if (!teamData) return null;

    return {
      id: teamData.id,
      name: teamData.name,
      logo: teamData.logo,
      budget: teamData.budget,
      players: [],
      isAI: teamData.is_ai,
      isUser: !teamData.is_ai,
    };
  },

  async fetchTeamsByUser(userId: string): Promise<Team[]> {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching teams:', error);
      throw error;
    }

    return (data || []).map(team => ({
      id: team.id,
      name: team.name,
      logo: team.logo,
      budget: team.budget,
      players: [],
      isAI: team.is_ai,
      isUser: !team.is_ai,
    }));
  },

  async fetchTeamById(id: string): Promise<Team | null> {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching team:', error);
      return null;
    }

    if (!data) return null;

    return {
      id: data.id,
      name: data.name,
      logo: data.logo,
      budget: data.budget,
      players: [],
      isAI: data.is_ai,
      isUser: !data.is_ai,
    };
  },

  async updateTeamBudget(teamId: string, newBudget: number): Promise<boolean> {
    const { error } = await supabase
      .from('teams')
      .update({ remaining_budget: newBudget })
      .eq('id', teamId);

    if (error) {
      console.error('Error updating team budget:', error);
      return false;
    }

    return true;
  },

  async addPlayerToTeam(teamId: string, playerId: string, soldPrice: number): Promise<boolean> {
    const { error } = await supabase
      .from('team_players')
      .insert([
        {
          team_id: teamId,
          player_id: playerId,
          sold_price: soldPrice,
        },
      ]);

    if (error) {
      console.error('Error adding player to team:', error);
      return false;
    }

    return true;
  },

  async fetchTeamPlayers(teamId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('team_players')
      .select(`
        id,
        sold_price,
        purchased_at,
        player_id,
        players(*)
      `)
      .eq('team_id', teamId);

    if (error) {
      console.error('Error fetching team players:', error);
      return [];
    }

    return data || [];
  },
};
