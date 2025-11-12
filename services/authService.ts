import { supabase } from './supabaseClient';
import { AuthUser, UserProfile } from '../types';

export const authService = {
  async signUp(email: string, password: string, username: string): Promise<AuthUser | null> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
        },
      },
    });

    if (error) {
      console.error('Error signing up:', error);
      throw error;
    }

    if (data.user) {
      // Create user profile
      await this.createProfile(data.user.id, email, username);
    }

    return data.user || null;
  },

  async signIn(email: string, password: string): Promise<AuthUser | null> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Error signing in:', error);
      throw error;
    }

    return data.user || null;
  },

  async signOut(): Promise<boolean> {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Error signing out:', error);
      return false;
    }

    return true;
  },

  async getCurrentUser(): Promise<AuthUser | null> {
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      console.error('Error getting current user:', error);
      return null;
    }

    return data.user || null;
  },

  async getSession() {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.error('Error getting session:', error);
      return null;
    }

    return data.session;
  },

  async createProfile(userId: string, email: string, username: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .insert([
        {
          id: userId,
          email,
          username,
        },
      ])
      .select();

    if (error) {
      console.error('Error creating profile:', error);
      return null;
    }

    return data?.[0] || null;
  },

  async getProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    return data;
  },

  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select();

    if (error) {
      console.error('Error updating profile:', error);
      return null;
    }

    return data?.[0] || null;
  },

  async subscribeToAuthChanges(callback: (user: AuthUser | null) => void) {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      callback(session?.user || null);
    });

    return data.subscription;
  },
};
