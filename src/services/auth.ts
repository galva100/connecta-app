import { supabase } from '../lib/supabase';

export async function signInWithEmail(email: string, password: string) {
  if (!supabase) return { error: null, demo: true };
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return { error, demo: false };
}

export async function signUpWithEmail(email: string, password: string) {
  if (!supabase) return { error: null, demo: true };
  const { error } = await supabase.auth.signUp({ email, password });
  return { error, demo: false };
}
