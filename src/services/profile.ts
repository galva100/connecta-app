import { supabase } from '../lib/supabase';

export type EditableProfile = {
  displayName: string;
  city: string;
  bio: string;
  interests: string;
};

type ProfileRow = {
  display_name: string;
  city: string | null;
  bio: string;
  interests: string[] | null;
};

export async function loadMyProfile(): Promise<EditableProfile | null> {
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase.from('profiles').select('display_name, city, bio, interests').eq('id', user.id).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const profile = data as ProfileRow;
  return { displayName: profile.display_name, city: profile.city || '', bio: profile.bio || '', interests: (profile.interests || []).join(', ') };
}

export async function saveMyProfile(profile: EditableProfile) {
  if (!supabase) return;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Debes iniciar sesión para guardar tu perfil.');
  const interests = profile.interests.split(',').map((value) => value.trim()).filter(Boolean).slice(0, 8);
  const { error } = await supabase.from('profiles').upsert({ id: user.id, display_name: profile.displayName.trim(), city: profile.city.trim(), bio: profile.bio.trim(), interests }, { onConflict: 'id' });
  if (error) throw error;
}
