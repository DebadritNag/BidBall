import { supabase } from './supabaseClient';
import { ChatMessage } from '../types';

export const chatService = {
  async sendMessage(roomId: string, senderId: string, senderName: string, text: string): Promise<boolean> {
    const { error } = await supabase
      .from('chat_messages')
      .insert([
        {
          room_id: roomId,
          sender_id: senderId,
          sender_name: senderName,
          text,
        },
      ]);

    if (error) {
      console.error('Error sending message:', error);
      return false;
    }

    return true;
  },

  async fetchRoomMessages(roomId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return [];
    }

    return data || [];
  },

  async subscribeToRoomMessages(roomId: string, callback: (message: any) => void) {
    const subscription = supabase
      .channel(`room:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          callback(payload.new);
        }
      )
      .subscribe();

    return subscription;
  },
};
