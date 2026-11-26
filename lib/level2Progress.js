export const LEVEL2_MISSIONS = [
  { id: 'alas', label: 'Tebang Wit (Kapak)', icon: '🪓' },
  { id: 'kali', label: 'Jembatan 3 Kayu', icon: '🪵' },
  { id: 'jurang', label: 'Tali Rotan Jurang', icon: '🪢' },
  { id: 'gua', label: 'Obor Guwa Peteng', icon: '🔥' },
  { id: 'macan', label: 'Ngliwati Macan', icon: '🐅' },
  { id: 'pring', label: 'Kreteg Pring', icon: '🎋' },
  { id: 'kembang', label: 'Kembang Pusaka', icon: '🌸' },
  { id: 'labirin', label: 'Gerbang Labirin', icon: '🌿' },
  { id: 'padhepokan', label: 'Padhepokan Alas', icon: '🏯' },
  { id: 'jamu', label: 'Gegodhongan Jamu', icon: '🍃' },
  { id: 'ngolah', label: 'Ngolah Jamu Usada', icon: '🍵' },
  { id: 'ngunjuk', label: 'Nglunjuk Jamu Usada', icon: '🥣' },
];

/**
 * Records completion of a Level 2 forest adventure checkpoint for the current student.
 */
export async function recordLevel2Mission(supabase, missionId) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const [{ data: existing }, { data: profile }] = await Promise.all([
      supabase
        .from('level2_orientasi_results')
        .select('completed_missions')
        .eq('user_id', user.id)
        .maybeSingle(),
      supabase
        .from('profiles')
        .select('nama_lengkap, nomor_induk')
        .eq('id', user.id)
        .maybeSingle(),
    ]);

    const prev = Array.isArray(existing?.completed_missions) ? existing.completed_missions : [];
    const merged = prev.includes(missionId) ? prev : [...prev, missionId];

    await supabase.from('level2_orientasi_results').upsert(
      {
        user_id: user.id,
        student_name: profile?.nama_lengkap || user.email?.split('@')[0] || 'Murid',
        student_nisn: profile?.nomor_induk || '',
        completed_missions: merged,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );
  } catch (err) {
    console.error(`Failed recording level 2 mission (${missionId}):`, err);
  }
}
