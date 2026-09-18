import { useEffect, useMemo, useState } from 'react';
import { Alert, Image, Pressable, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, View } from 'react-native';
import { demoProfiles } from './src/data/profiles';
import { signInWithEmail, signUpWithEmail } from './src/services/auth';
import { likeProfile } from './src/services/dating';
import { EditableProfile, loadMyProfile, saveMyProfile } from './src/services/profile';

type Tab = 'discover' | 'likes' | 'profile';

function AuthScreen({ onAuthenticated }: { onAuthenticated: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const submit = async (register: boolean) => {
    if (!email.includes('@') || password.length < 6) return Alert.alert('Revisa tus datos', 'Usa un correo válido y una contraseña de al menos 6 caracteres.');
    setLoading(true);
    const result = register ? await signUpWithEmail(email, password) : await signInWithEmail(email, password);
    setLoading(false);
    if (result.error) return Alert.alert('No fue posible continuar', result.error.message);
    if (result.demo) Alert.alert('Modo demostración', 'Agrega las claves de Supabase en .env para conectar cuentas reales.');
    onAuthenticated();
  };
  return <SafeAreaView style={styles.screen}><StatusBar barStyle="dark-content" /><View style={styles.auth}>
    <Text style={styles.logo}>connecta</Text><Text style={styles.tagline}>Personas reales. Conexiones que importan.</Text>
    <TextInput autoCapitalize="none" autoComplete="email" keyboardType="email-address" placeholder="Correo electrónico" value={email} onChangeText={setEmail} style={styles.input} />
    <TextInput autoComplete="password" secureTextEntry placeholder="Contraseña" value={password} onChangeText={setPassword} style={styles.input} />
    <Pressable style={styles.primaryButton} onPress={() => submit(false)} disabled={loading}><Text style={styles.primaryText}>{loading ? 'Conectando…' : 'Iniciar sesión'}</Text></Pressable>
    <Pressable onPress={() => submit(true)}><Text style={styles.link}>Crear una cuenta</Text></Pressable>
  </View></SafeAreaView>;
}

function Discover({ onLike }: { onLike: (profileId: string) => void }) {
  const [index, setIndex] = useState(0); const profile = demoProfiles[index % demoProfiles.length];
  const choose = (liked: boolean) => { if (liked) onLike(profile.id); setIndex((value) => value + 1); };
  return <View style={styles.content}><Text style={styles.title}>Descubrir</Text><View style={styles.card}>
    <Image source={{ uri: profile.photoUrl }} style={styles.photo} /><View style={styles.cardInfo}><Text style={styles.name}>{profile.name}, {profile.age}</Text><Text style={styles.muted}>{profile.city} · A {profile.distanceKm} km</Text><Text style={styles.bio}>{profile.bio}</Text><View style={styles.chips}>{profile.interests.map((item) => <Text key={item} style={styles.chip}>{item}</Text>)}</View></View>
  </View><View style={styles.actions}><Pressable style={[styles.action, styles.nope]} onPress={() => choose(false)}><Text style={styles.actionText}>×</Text></Pressable><Pressable style={[styles.action, styles.like]} onPress={() => choose(true)}><Text style={styles.actionText}>♥</Text></Pressable></View></View>;
}

function Likes({ likes }: { likes: number }) { return <View style={styles.content}><Text style={styles.title}>Tus conexiones</Text><View style={styles.empty}><Text style={styles.emptyIcon}>♥</Text><Text style={styles.emptyTitle}>{likes ? '¡Hay interés mutuo!' : 'Aún no hay conexiones'}</Text><Text style={styles.muted}>{likes ? 'Sigue explorando para conocer personas afines.' : 'Cuando alguien corresponda tu interés, aparecerá aquí.'}</Text></View></View>; }
function Profile() {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<EditableProfile>({ displayName: 'Tu perfil', city: '', bio: '', interests: '' });
  useEffect(() => { void loadMyProfile().then((saved) => { if (saved) setProfile(saved); }).catch(() => undefined); }, []);
  const save = async () => {
    if (!profile.displayName.trim()) return Alert.alert('Agrega tu nombre', 'Es necesario para mostrar tu perfil.');
    setSaving(true);
    try { await saveMyProfile(profile); setEditing(false); Alert.alert('Perfil actualizado', 'Tus cambios se guardaron correctamente.'); }
    catch (error) { Alert.alert('No pudimos guardar', error instanceof Error ? error.message : 'Inténtalo de nuevo.'); }
    finally { setSaving(false); }
  };
  if (editing) return <ScrollView contentContainerStyle={styles.content}><Text style={styles.title}>Editar perfil</Text><Text style={styles.fieldLabel}>Nombre</Text><TextInput value={profile.displayName} onChangeText={(displayName) => setProfile((value) => ({ ...value, displayName }))} style={styles.input} placeholder="¿Cómo te llamas?" maxLength={40} /><Text style={styles.fieldLabel}>Ciudad</Text><TextInput value={profile.city} onChangeText={(city) => setProfile((value) => ({ ...value, city }))} style={styles.input} placeholder="Santiago" maxLength={60} /><Text style={styles.fieldLabel}>Sobre ti</Text><TextInput value={profile.bio} onChangeText={(bio) => setProfile((value) => ({ ...value, bio }))} style={[styles.input, styles.textArea]} multiline placeholder="Cuéntale algo a las personas que quieres conocer" maxLength={400} /><Text style={styles.fieldLabel}>Intereses</Text><TextInput value={profile.interests} onChangeText={(interests) => setProfile((value) => ({ ...value, interests }))} style={styles.input} placeholder="Café, cine, senderismo" maxLength={150} /><Text style={styles.hint}>Separa tus intereses con comas.</Text><Pressable style={styles.primaryButton} onPress={save} disabled={saving}><Text style={styles.primaryText}>{saving ? 'Guardando…' : 'Guardar cambios'}</Text></Pressable><Pressable onPress={() => setEditing(false)}><Text style={styles.link}>Cancelar</Text></Pressable></ScrollView>;
  return <View style={styles.content}><Text style={styles.title}>Mi perfil</Text><View style={styles.profileHeader}><View style={styles.avatar}><Text style={styles.avatarText}>{profile.displayName.slice(0, 2).toUpperCase()}</Text></View><Text style={styles.name}>{profile.displayName}</Text><Text style={styles.muted}>{profile.city || 'Completa tu ciudad para aparecer cerca de otras personas.'}</Text>{profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}{profile.interests ? <View style={styles.chips}>{profile.interests.split(',').map((interest) => interest.trim()).filter(Boolean).map((interest) => <Text style={styles.chip} key={interest}>{interest}</Text>)}</View> : null}</View><Pressable style={styles.secondaryButton} onPress={() => setEditing(true)}><Text style={styles.secondaryText}>Editar perfil</Text></Pressable></View>;
}

export default function App() {
  const [authenticated, setAuthenticated] = useState(false); const [tab, setTab] = useState<Tab>('discover'); const [likes, setLikes] = useState(0);
  const handleLike = async (profileId: string) => {
    try {
      const result = await likeProfile(profileId);
      setLikes((n) => n + 1);
      if (result.matched) Alert.alert('¡Es un match!', 'Ahora ambos pueden empezar una conversación.');
    } catch (error) {
      Alert.alert('No pudimos guardar tu interés', error instanceof Error ? error.message : 'Inténtalo de nuevo.');
    }
  };
  const page = useMemo(() => tab === 'discover' ? <Discover onLike={handleLike} /> : tab === 'likes' ? <Likes likes={likes} /> : <Profile />, [tab, likes]);
  if (!authenticated) return <AuthScreen onAuthenticated={() => setAuthenticated(true)} />;
  return <SafeAreaView style={styles.screen}><StatusBar barStyle="dark-content" />{page}<View style={styles.tabBar}>{([['discover', '⌁', 'Descubrir'], ['likes', '♥', 'Conexiones'], ['profile', '◉', 'Perfil']] as const).map(([value, icon, label]) => <Pressable key={value} style={styles.tab} onPress={() => setTab(value)}><Text style={[styles.tabIcon, tab === value && styles.active]}>{icon}</Text><Text style={[styles.tabLabel, tab === value && styles.active]}>{label}</Text></Pressable>)}</View></SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff9fb' }, auth: { flex: 1, padding: 28, justifyContent: 'center', gap: 14 }, logo: { color: '#e33f70', fontSize: 42, fontWeight: '800', textAlign: 'center' }, tagline: { color: '#6b6670', fontSize: 16, marginBottom: 24, textAlign: 'center' }, input: { backgroundColor: '#fff', borderColor: '#eee5e9', borderWidth: 1, borderRadius: 14, fontSize: 16, padding: 16 }, primaryButton: { backgroundColor: '#e33f70', borderRadius: 14, padding: 17, alignItems: 'center', marginTop: 14 }, primaryText: { color: '#fff', fontWeight: '700', fontSize: 16 }, link: { color: '#e33f70', fontWeight: '700', textAlign: 'center', padding: 12 }, content: { flex: 1, padding: 20 }, title: { fontSize: 28, fontWeight: '800', color: '#251b22', marginBottom: 18 }, fieldLabel: { color: '#40373c', fontWeight: '700', marginBottom: 7, marginTop: 12 }, hint: { color: '#77707a', fontSize: 12, marginTop: 6 }, textArea: { minHeight: 110, textAlignVertical: 'top' }, card: { backgroundColor: '#fff', borderRadius: 24, overflow: 'hidden', shadowColor: '#42232e', shadowOpacity: .12, shadowRadius: 14, elevation: 4 }, photo: { width: '100%', height: 350, backgroundColor: '#f1e7eb' }, cardInfo: { padding: 18 }, name: { color: '#251b22', fontSize: 23, fontWeight: '800' }, muted: { color: '#77707a', fontSize: 14, lineHeight: 20 }, bio: { color: '#3d3339', fontSize: 15, lineHeight: 21, marginTop: 12 }, chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 }, chip: { backgroundColor: '#fce8ef', color: '#b52a55', borderRadius: 999, fontWeight: '600', paddingHorizontal: 10, paddingVertical: 6 }, actions: { flexDirection: 'row', justifyContent: 'center', gap: 26, paddingVertical: 20 }, action: { alignItems: 'center', borderRadius: 99, height: 58, justifyContent: 'center', width: 58 }, nope: { backgroundColor: '#fff', borderColor: '#f0d7df', borderWidth: 1 }, like: { backgroundColor: '#e33f70' }, actionText: { color: '#fff', fontSize: 31, fontWeight: '700' }, empty: { alignItems: 'center', backgroundColor: '#fff', borderRadius: 24, marginTop: 80, padding: 34 }, emptyIcon: { color: '#e33f70', fontSize: 46 }, emptyTitle: { color: '#251b22', fontSize: 19, fontWeight: '800', marginTop: 12 }, profileHeader: { alignItems: 'center', backgroundColor: '#fff', borderRadius: 24, padding: 28 }, avatar: { alignItems: 'center', backgroundColor: '#fce8ef', borderRadius: 60, height: 100, justifyContent: 'center', width: 100, marginBottom: 12 }, avatarText: { color: '#e33f70', fontWeight: '800' }, secondaryButton: { borderColor: '#e33f70', borderRadius: 14, borderWidth: 1, marginTop: 20, padding: 16, alignItems: 'center' }, secondaryText: { color: '#e33f70', fontWeight: '700' }, tabBar: { backgroundColor: '#fff', borderTopColor: '#f0e9ec', borderTopWidth: 1, flexDirection: 'row', paddingBottom: 8, paddingTop: 8 }, tab: { alignItems: 'center', flex: 1, gap: 2 }, tabIcon: { color: '#9b9298', fontSize: 23 }, tabLabel: { color: '#9b9298', fontSize: 11 }, active: { color: '#e33f70', fontWeight: '800' }
});
