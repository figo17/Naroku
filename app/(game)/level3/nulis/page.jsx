'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

/*
  Lv 3 – Mode Nulis (1024 x 768, 4:3)
  Kertas garis: x 34..772, y 394..671; garis saben ±26.5px (3.45% dhuwur).
  Textarea transparan dipasang persis ing ndhuwur garis-garis kertas.
*/

const MIN_WORDS = 60;

const CHECKS = [
  {
    id: 'paraga',
    label: 'Paraga',
    hint: 'Sebutna paraga: Rara Kuning, Rara Runting (Dewi Kilisuci), Resi Darmo.',
    words: ['rara kuning', 'roro kuning', 'rara runting', 'roro runting', 'kilisuci', 'resi darmo'],
  },
  {
    id: 'rintangan',
    label: 'Rintangane Putri',
    hint: 'Critakna rintangan ing alas: kali, jurang, guwa, macan, labirin, lsp.',
    words: ['alas', 'kali', 'jurang', 'guwa', 'gua', 'macan', 'labirin', 'kreteg', 'kabut', 'wit'],
  },
  {
    id: 'kasarasan',
    label: 'Kasarasan Putri',
    hint: 'Critakna kepriye putri pulih: godhong, jamu, lara, waras/mari.',
    words: ['jamu', 'godhong', 'lara', 'waras', 'mari', 'sehat', 'tamba', 'usada', 'penyakit'],
  },
  {
    id: 'grojogan',
    label: 'Grojogan Rara Kuning',
    hint: 'Pungkasi crita nganggo asal-usul Grojogan Rara Kuning.',
    words: ['grojogan', 'air terjun', 'adus'],
  },
];

function countWords(t) {
  return t.trim() ? t.trim().split(/\s+/).length : 0;
}

export default function Level3NulisPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [studentProfile, setStudentProfile] = useState(null);
  const [narasi, setNarasi] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [audioPlaying, setAudioPlaying] = useState(false);

  const [modal, setModal] = useState(null); // 'priksa' | 'ngulang' | 'tas' | 'tugas' | 'buku' | 'saved'

  useEffect(() => {
    async function load() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login?role=murid');
          return;
        }
        setCurrentUser(user);

        const [{ data: profile }, { data: saved }] = await Promise.all([
          supabase.from('profiles').select('nama_lengkap, nomor_induk').eq('id', user.id).maybeSingle(),
          supabase.from('level3_nulis_answers').select('narasi').eq('user_id', user.id).maybeSingle(),
        ]);
        if (profile) setStudentProfile(profile);
        if (saved?.narasi) setNarasi(saved.narasi);
      } catch (err) {
        console.error('Error loading level 3 nulis:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router, supabase]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3800);
    return () => clearTimeout(t);
  }, [toast]);

  const wordCount = countWords(narasi);
  const lower = narasi.toLowerCase();
  const checkResults = CHECKS.map((c) => ({ ...c, ok: c.words.some((w) => lower.includes(w)) }));
  const sentenceCount = narasi.split(/[.!?]+/).filter((s) => s.trim().length > 3).length;

  const handleSimpen = useCallback(async () => {
    if (!currentUser) return;
    if (!narasi.trim()) {
      setToast({ type: 'error', text: 'Tulisen dhisik critamu sadurunge nyimpen!' });
      return;
    }
    setIsSaving(true);
    try {
      const { error } = await supabase.from('level3_nulis_answers').upsert(
        {
          user_id: currentUser.id,
          student_name: studentProfile?.nama_lengkap || currentUser.email?.split('@')[0] || 'Murid',
          student_nisn: studentProfile?.nomor_induk || '',
          narasi: narasi.trim(),
          word_count: countWords(narasi),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );
      if (error) {
        console.error('Supabase error saving level 3 narasi:', error);
        setToast({ type: 'error', text: 'Gagal nyimpen. Priksa sambungan internetmu!' });
      } else {
        setModal('saved');
      }
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', text: 'Ana kaluputan nalika nyimpen tulisan.' });
    } finally {
      setIsSaving(false);
    }
  }, [currentUser, narasi, studentProfile, supabase]);

  if (loading) {
    return (
      <div className="w-screen h-screen bg-[#04120a] flex flex-col items-center justify-center text-yellow-400 gap-3 font-sans select-none">
        <div className="w-10 h-10 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm tracking-wide text-amber-200">Mbukak Mode Nulis Level 3...</p>
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen bg-[#04120a] text-stone-100 flex items-center justify-center overflow-hidden select-none font-sans">
      {/* Container 4:3 (1024 x 768) – containerType size kanggo unit cqh */}
      <div
        className="relative w-full h-full max-w-[calc(100vh*4/3)] max-h-[calc(100vw*3/4)] aspect-[4/3] overflow-hidden shadow-2xl"
        style={{ containerType: 'size' }}
      >
        <Image
          src="/assets/level3/screen_level3_nulis.jpg"
          alt="Lv 3 – Mode Nulis: Katrampilan Nulis Siswa"
          fill
          priority
          sizes="100vw"
          className="object-contain object-center"
        />

        {/* ===== TOP BAR: Tas, Tugas, Peta, Buku Cathetan, Swara, Setelan ===== */}
        <button type="button" onClick={() => setModal('tas')} title="Tas"
          className="absolute left-[53.8%] top-[1.0%] w-[7.2%] h-[4.6%] rounded-lg bg-transparent hover:bg-yellow-400/15 cursor-pointer z-30">
          <span className="sr-only">Tas</span>
        </button>
        <button type="button" onClick={() => setModal('tugas')} title="Tugas"
          className="absolute left-[61.9%] top-[1.0%] w-[8.6%] h-[4.6%] rounded-lg bg-transparent hover:bg-yellow-400/15 cursor-pointer z-30">
          <span className="sr-only">Tugas</span>
        </button>
        <Link href="/peta" title="Peta Petualangan"
          className="absolute left-[71.3%] top-[1.0%] w-[8.0%] h-[4.6%] rounded-lg bg-transparent hover:bg-yellow-400/15 cursor-pointer z-30" />
        <button type="button" onClick={() => setModal('buku')} title="Buku Cathetan"
          className="absolute left-[80.1%] top-[1.0%] w-[12.4%] h-[4.6%] rounded-lg bg-transparent hover:bg-yellow-400/15 cursor-pointer z-30">
          <span className="sr-only">Buku Cathetan</span>
        </button>
        <button type="button" onClick={() => setAudioPlaying((p) => !p)} title={audioPlaying ? 'Pateni Swara' : 'Uripake Swara'}
          className="absolute left-[93.0%] top-[1.0%] w-[3.0%] h-[4.6%] rounded-lg bg-transparent hover:bg-yellow-400/15 cursor-pointer z-30">
          <span className="sr-only">Swara</span>
        </button>
        <Link href="/level3" title="Bali menyang Intro Level 3"
          className="absolute left-[96.3%] top-[1.0%] w-[3.1%] h-[4.6%] rounded-lg bg-transparent hover:bg-yellow-400/15 cursor-pointer z-30" />

        {/* ===== TEXTBOX TRANSPARAN ING NDHUWUR GARIS KERTAS ===== */}
        <textarea
          value={narasi}
          onChange={(e) => setNarasi(e.target.value)}
          placeholder="Tulisen critane Legenda Rara Kuning ing kene ..."
          spellCheck={false}
          className="absolute z-20 left-[4.3%] top-[55.2%] w-[69.9%] h-[31.05%] bg-transparent text-amber-950 font-serif tracking-wide px-[0.8%] py-0 border-none outline-none focus:outline-none focus:ring-0 resize-none overflow-y-auto placeholder:text-stone-400/90 placeholder:italic selection:bg-amber-300/40 select-text"
          style={{ fontSize: '2.2cqh', lineHeight: '3.45cqh' }}
        />

        {/* Indikator cacahing tembung (pojok tengen ngisor kertas) */}
        <div className="absolute z-20 left-[58.5%] top-[83.2%] px-2 py-0.5 rounded-full bg-amber-900/85 border border-amber-500/60 text-amber-100 text-[9px] sm:text-[11px] font-bold pointer-events-none">
          {wordCount} tembung
        </div>

        {/* ===== TOMBOL TENGEN: Priksa Gladhen, Simpen, Ngulang ===== */}
        <button type="button" onClick={() => setModal('priksa')} title="Priksa Gladhen"
          className="absolute left-[80.0%] top-[71.9%] w-[19.2%] h-[6.5%] rounded-lg bg-transparent hover:bg-yellow-300/20 hover:ring-2 hover:ring-yellow-300 active:scale-[0.98] transition-all cursor-pointer z-30">
          <span className="sr-only">Priksa Gladhen</span>
        </button>
        <button type="button" onClick={handleSimpen} disabled={isSaving} title={isSaving ? 'Nyimpen...' : 'Simpen'}
          className="absolute left-[80.0%] top-[79.3%] w-[19.2%] h-[6.5%] rounded-lg bg-transparent hover:bg-emerald-300/20 hover:ring-2 hover:ring-emerald-300 active:scale-[0.98] transition-all cursor-pointer z-30 flex items-center justify-end pr-3 disabled:opacity-70">
          {isSaving && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
          <span className="sr-only">Simpen</span>
        </button>
        <button type="button" onClick={() => setModal('ngulang')} title="Ngulang"
          className="absolute left-[80.0%] top-[86.8%] w-[19.2%] h-[6.5%] rounded-lg bg-transparent hover:bg-red-300/20 hover:ring-2 hover:ring-red-300 active:scale-[0.98] transition-all cursor-pointer z-30">
          <span className="sr-only">Ngulang</span>
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-[90%] px-4 py-2.5 rounded-2xl border shadow-2xl text-xs sm:text-sm font-bold ${
          toast.type === 'error' ? 'bg-red-950/95 border-red-400 text-red-200' : 'bg-emerald-950/95 border-emerald-400 text-emerald-200'
        }`}>
          {toast.text}
        </div>
      )}

      {/* ===== MODALS ===== */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-md font-sans">
          <div className="relative max-w-lg w-full bg-stone-900 border-2 border-yellow-500/85 rounded-2xl p-6 shadow-2xl text-stone-100 space-y-4 max-h-[88vh] overflow-y-auto">
            {modal === 'priksa' && (
              <>
                <h3 className="text-xl font-serif font-black text-yellow-400">🔍 Asil Priksa Gladhen</h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className={`p-2.5 rounded-lg border ${wordCount >= MIN_WORDS ? 'bg-emerald-950/50 border-emerald-500/60 text-emerald-200' : 'bg-amber-950/50 border-amber-500/60 text-amber-200'}`}>
                    <p className="font-bold">Cacahing tembung</p>
                    <p>{wordCount} / minimal {MIN_WORDS}</p>
                  </div>
                  <div className={`p-2.5 rounded-lg border ${sentenceCount >= 5 ? 'bg-emerald-950/50 border-emerald-500/60 text-emerald-200' : 'bg-amber-950/50 border-amber-500/60 text-amber-200'}`}>
                    <p className="font-bold">Cacahing ukara</p>
                    <p>{sentenceCount} / minimal 5</p>
                  </div>
                </div>
                <div className="space-y-2 text-xs sm:text-sm font-serif">
                  {checkResults.map((c) => (
                    <div key={c.id} className={`p-2.5 rounded-lg border ${c.ok ? 'bg-emerald-950/40 border-emerald-600/50' : 'bg-stone-950/70 border-stone-700'}`}>
                      <p className={`font-bold ${c.ok ? 'text-emerald-300' : 'text-amber-300'}`}>{c.ok ? '✓' : '○'} {c.label}</p>
                      {!c.ok && <p className="text-stone-400 text-[11px] mt-0.5">{c.hint}</p>}
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-stone-400 italic">Tip: tulisen kanthi runtut — wiwitan, rintangan, kasarasan, lan pungkasan crita.</p>
                <div className="flex justify-end">
                  <button type="button" onClick={() => setModal(null)} className="px-5 py-2 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-stone-950 font-black text-xs cursor-pointer">Bali Nulis</button>
                </div>
              </>
            )}

            {modal === 'ngulang' && (
              <>
                <h3 className="text-xl font-serif font-black text-red-400">🔄 Kosongake Tulisan?</h3>
                <p className="text-xs sm:text-sm text-stone-300 font-serif">Kabeh tulisan ing kertas bakal dibusak. Tulisan sing wis disimpen ing database ora katut dibusak nganti kowe nyimpen maneh.</p>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setModal(null)} className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-600 text-stone-300 text-xs font-bold cursor-pointer">Batal</button>
                  <button type="button" onClick={() => { setNarasi(''); setModal(null); }} className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black cursor-pointer">Kosongake</button>
                </div>
              </>
            )}

            {modal === 'saved' && (
              <>
                <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-3xl">🎉</div>
                <h3 className="text-xl font-serif font-black text-yellow-400 text-center">Crita Kasil Disimpen!</h3>
                <p className="text-xs sm:text-sm text-stone-300 font-serif text-center">Narasi Legenda Rara Kuning ({wordCount} tembung) wis disimpen lan bisa diwaca guru ing Dashboard.</p>
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  <button type="button" onClick={() => setModal(null)} className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-600 text-stone-300 text-xs font-bold cursor-pointer">Terusake Nulis</button>
                  <Link href="/peta" className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 text-stone-950 font-black text-xs text-center">🗺️ Menyang Peta →</Link>
                </div>
              </>
            )}

            {modal === 'tugas' && (
              <>
                <h3 className="text-xl font-serif font-black text-yellow-400">⭐ Tugas Level 3</h3>
                <p className="text-xs sm:text-sm text-stone-300 font-serif leading-relaxed">Tulisen critane <strong>Legenda Rara Kuning</strong> adhedhasar pengalaman sajrone game kanthi basa sing bener lan runtut. Gunakake imajinasi lan tembungmu dhewe!</p>
                <ul className="text-xs sm:text-sm text-stone-300 font-serif list-disc list-inside space-y-1">
                  <li>Pangembangan diksi</li>
                  <li>Paraga</li>
                  <li>Rintangane Putri</li>
                  <li>Kasarasan Putri</li>
                  <li>Grojogan Rara Kuning</li>
                </ul>
                <div className="flex justify-end"><button type="button" onClick={() => setModal(null)} className="px-5 py-2 rounded-xl bg-yellow-500 text-stone-950 font-black text-xs cursor-pointer">Ngerti</button></div>
              </>
            )}

            {modal === 'buku' && (
              <>
                <h3 className="text-xl font-serif font-black text-yellow-400">📖 Buku Cathetan Lelampahan</h3>
                <div className="space-y-1.5 text-xs sm:text-sm text-stone-300 font-serif leading-relaxed">
                  <p>1. Rara Kuning lan Rara Runting nandhang lara; perawatan ing kraton durung kasil.</p>
                  <p>2. Para putri ngumbara menyang alas Gunung Wilis: nugel wit, nyebrang kali, jurang, guwa peteng, macan, kreteg pring, kabut, lan labirin.</p>
                  <p>3. Tekan Padhepokan Resi Darmo; ngumpulake godhong Tapak Liman, Sirih, Sambiloto, lan Mindi.</p>
                  <p>4. Jamu diracik lan diunjuk; para putri uga adus ing grojogan suci nganti waras.</p>
                  <p>5. Grojogan iku banjur dijuluki <strong>Grojogan Rara Kuning</strong>.</p>
                </div>
                <div className="flex justify-end"><button type="button" onClick={() => setModal(null)} className="px-5 py-2 rounded-xl bg-yellow-500 text-stone-950 font-black text-xs cursor-pointer">Tutup</button></div>
              </>
            )}

            {modal === 'tas' && (
              <>
                <h3 className="text-xl font-serif font-black text-yellow-400">🎒 Isine Tas</h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {['🪓 Kapak', '🔥 Obor', '🪢 Tali Rotan', '🌸 Kembang Pusaka', '🍃 Godhong Jamu', '🥣 Jamu Usada'].map((it) => (
                    <div key={it} className="p-2 rounded-lg bg-stone-950/70 border border-amber-600/40 text-amber-100">{it}</div>
                  ))}
                </div>
                <div className="flex justify-end"><button type="button" onClick={() => setModal(null)} className="px-5 py-2 rounded-xl bg-yellow-500 text-stone-950 font-black text-xs cursor-pointer">Tutup</button></div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
