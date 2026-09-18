import { supabase } from '../lib/supabase';
import { Profile } from '../types/profile';

type DatabaseProfile = {
  id: string;
  display_name: string;
  birth_date: string | null;
  bio: string;
  city: string | null;
  avatar_url: string | null;
  interests: string[] | null;
};

function ageFromBirthDate(birthDate: string | null) {
  if (!birthDate) return 18;
  const today = new Date();
  const birth = new Date(`${birthDate}T00:00:00`);
  let age = today.getFullYear() - birth.getFullYear();
  const beforeBirthday = today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate());
  return beforeBirthday ? age - 1 : age;
}

function toProfile(profile: DatabaseProfile): Profile {
  return {
    id: profile.id,
    name: profile.display_name,
    age: ageFromBirthDate(profile.birth_date),
    bio: profile.bio || 'Aún no ha escrito una descripción.',
    city: profile.city || 'Cerca de ti',
    distanceKm: 0,
    photoUrl: profile.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=900&q=80',
    interests: profile.interests || []
  };
}

export async function loadDiscoverableProfiles(currentUserId: string): Promise<Profile[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from('profiles').select('id, display_name, birth_date, bio, city, avatar_url, interests').neq('id', currentUserId).limit(25);
  if (error) throw error;
  return (data as DatabaseProfile[]).map(toProfile);
}

export async function likeProfile(recipientId: string) {
  if (!supabase) return { matched: false };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Debes iniciar sesión para indicar interés.');
  const { error } = await supabase.from('likes').upsert({ sender_id: user.id, recipient_id: recipientId }, { onConflict: 'sender_id,recipient_id' });
  if (error) throw error;
  const first = [user.id, recipientId].sort()[0];
  const second = [user.id, recipientId].sort()[1];
  const { data: match } = await supabase.from('matches').select('id').eq('user_one_id', first).eq('user_two_id', second).maybeSingle();
  return { matched: Boolean(match) };
}
