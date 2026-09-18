import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { ChatMessage } from '../types/message';

type DatabaseMessage = {
  id: number;
  match_id: number;
  sender_id: string;
  body: string;
  created_at: string;
};

function toMessage(message: DatabaseMessage): ChatMessage {
  return { id: message.id, matchId: message.match_id, senderId: message.sender_id, body: message.body, createdAt: message.created_at };
}

export async function loadMessages(matchId: number): Promise<ChatMessage[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from('messages').select('id, match_id, sender_id, body, created_at').eq('match_id', matchId).order('created_at');
  if (error) throw error;
  return (data as DatabaseMessage[]).map(toMessage);
}

export async function sendMessage(matchId: number, body: string) {
  if (!supabase) return null;
  const cleanBody = body.trim();
  if (!cleanBody) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Debes iniciar sesión para enviar un mensaje.');
  const { data, error } = await supabase.from('messages').insert({ match_id: matchId, sender_id: user.id, body: cleanBody }).select('id, match_id, sender_id, body, created_at').single();
  if (error) throw error;
  return toMessage(data as DatabaseMessage);
}

export function subscribeToMessages(matchId: number, onMessage: (message: ChatMessage) => void): RealtimeChannel | null {
  if (!supabase) return null;
  return supabase.channel(`match:${matchId}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `match_id=eq.${matchId}` }, (payload) => onMessage(toMessage(payload.new as DatabaseMessage))).subscribe();
}
