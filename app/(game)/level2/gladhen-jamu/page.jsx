'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function Level2GladhenJamuPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [studentProfile, setStudentProfile] = useState(null);
  const [audioPlaying, setAudioPlaying] = useState(false);

  const [answer, setAnswer] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  useEffect(() => {
    router.prefetch('/level2/grojogan');
    async function loadData() {
      try {
        setLoading(true);
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push('/login?role=murid');
          return;
        }

        setCurrentUser(user);

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profile) setStudentProfile(profile);

        const { data: savedData } = await supabase
          .from('level2_nanjak_answers')
          .select('mudhun_answer')
          .eq('user_id', user.id)
          .maybeSingle();

        if (savedData?.mudhun_answer) {
          setAnswer(savedData.mudhun_answer);
        }
      } catch (err) {
        console.error('Error loading level 2 gladhen jamu:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router, supabase]);

  const handleSave = async () => {
    if (!currentUser) return;

    if (!answer.trim()) {
      setToast({
        type: 'error',
        text: 'Tulisen dhisik wangsulanmu nganggo 2-3 ukara sadurunge nyimpen!',
      });
      setTimeout(() => setToast(null), 4000);
      return;
    }

    setIsSaving(true);
    setToast(null);

    try {
      const studentName = studentProfile?.nama_lengkap || currentUser.email.split('@')[0];
      const studentNisn = studentProfile?.nomor_induk || '';

      const { error } = await supabase.from('level2_nanjak_answers').upsert(
        {
          user_id: currentUser.id,
          student_name: studentName,
          student_nisn: studentNisn,
          mudhun_answer: answer.trim(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

      if (error) {
        console.error('Supabase error saving mudhun answer:', error);
        setToast({
          type: 'error',
          text: 'Gagal nyimpen wangsulan. Coba priksa sambungan internetmu!',
        });
        setTimeout(() => setToast(null), 4000);
      } else {
        setToast({
          type: 'success',
          text: '✓ Wangsulan Gladhen Nulis Jamu kasil disimpen!',
        });
        setTimeout(() => setToast(null), 4000);
        setShowSuccessModal(true);
      }
    } catch (err) {
      console.error('Error in handleSave:', err);
      setToast({
        type: 'error',
        text: 'Ana kaluputan nalika nyimpen wangsulan.',
      });
      setTimeout(() => setToast(null), 4000);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="w-screen h-screen bg-[#120b05] flex flex-col items-center justify-center text-yellow-400 gap-3 font-sans select-none">
        <div className="w-10 h-10 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm tracking-wide text-amber-200">Mbukak Gladhen Nulis – Ngumpulake Godhong...</p>
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen bg-[#120b05] text-stone-100 flex flex-col items-center justify-center overflow-hidden select-none font-sans">
      {/* Container 16:9 (1024 x 576) */}
      <div className="relative w-full h-full max-w-[calc(100vh*16/9)] max-h-[calc(100vw*9/16)] aspect-[16/9] overflow-hidden shadow-2xl select-none">
        <Image
          src="/assets/level2/screen_gladhen_mudhun.jpg"
          alt="Gladhen Nulis Level 2 - Ngumpulake Godhong Jamu"
          fill
          priority
          sizes="100vw"
          className="object-contain object-center"
        />

        {/* Top Navbar Hitboxes */}
        <Link
          href="/beranda"
          title="Rara Kuning - Bali menyang Beranda"
          className="absolute left-[1.8%] top-[1.0%] w-[20%] h-[7.2%] rounded-md bg-transparent hover:bg-yellow-400/10 cursor-pointer z-30"
        />

        <button
          type="button"
          onClick={() => setShowStoryModal(true)}
          title="Ringkesan Kegiatan Ngumpulake & Ngolah Jamu"
          className="absolute left-[83.8%] top-[1.2%] w-[4.0%] h-[6.8%] rounded-full bg-transparent hover:bg-yellow-400/20 cursor-pointer z-30"
        >
          <span className="sr-only">Ringkesan</span>
        </button>

        <button
          type="button"
          onClick={() => setShowHelpModal(true)}
          title="Petunjuk Gladhen Nulis"
          className="absolute left-[89.1%] top-[1.2%] w-[4.0%] h-[6.8%] rounded-full bg-transparent hover:bg-yellow-400/20 cursor-pointer z-30"
        >
          <span className="sr-only">Petunjuk</span>
        </button>

        <button
          type="button"
          onClick={() => setAudioPlaying((p) => !p)}
          title={audioPlaying ? 'Pateni Swara' : 'Uripake Swara'}
          className="absolute left-[94.4%] top-[1.2%] w-[4.0%] h-[6.8%] rounded-full bg-transparent hover:bg-yellow-400/20 cursor-pointer z-30 flex items-center justify-center"
        >
          {audioPlaying && (
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-ping opacity-80" />
          )}
          <span className="sr-only">Audio</span>
        </button>

        {/* ========================================================
            TEXTBOX TRANSPARAN (PERSIS DI ATAS KOTAK GARIS KERTAS)
           ======================================================== */}
        <div className="absolute left-[43.4%] top-[46.6%] w-[45.5%] h-[25.0%] z-20">
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Tulis wangsulanmu ing kene ..."
            className="w-full h-full bg-transparent text-amber-950 font-serif text-xs sm:text-sm md:text-base leading-[1.65rem] sm:leading-[2.1rem] md:leading-[2.45rem] tracking-wide px-3 py-1.5 border-none outline-none focus:outline-none focus:ring-0 resize-none overflow-y-auto placeholder:text-stone-400/85 placeholder:italic selection:bg-amber-300/40"
          />
        </div>

        {/* ========================================================
            TOMBOL TRANSPARAN: SIMPAN (💾 Simpan)
           ======================================================== */}
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          title={isSaving ? 'Nyimpen...' : 'Simpan Wangsulan'}
          className="absolute left-[57.0%] top-[76.5%] w-[18.2%] h-[8.0%] rounded-full bg-transparent hover:bg-emerald-300/20 hover:ring-2 hover:ring-yellow-300 hover:shadow-[0_0_25px_rgba(250,204,21,0.65)] active:scale-[0.98] transition-all duration-200 cursor-pointer z-30 flex items-center justify-center disabled:opacity-60"
        >
          {isSaving && (
            <span className="w-5 h-5 border-2 border-yellow-300 border-t-transparent rounded-full animate-spin" />
          )}
          <span className="sr-only">Simpan</span>
        </button>

        {/* Navigasi Cilik Bali & Lanjut */}
        <div className="absolute top-[10.2%] left-3 z-30">
          <Link
            href="/level2/ngunjuk"
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-stone-950/80 hover:bg-stone-900 border border-yellow-500/50 text-yellow-300 text-[10px] sm:text-xs font-bold backdrop-blur-md shadow-md active:scale-95 transition-all"
          >
            <span>⬅</span> Nglunjuk Jamu
          </Link>
        </div>

        {answer?.trim() && (
          <div className="absolute bottom-2.5 right-4 z-30">
            <Link
              href="/level2/grojogan"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-yellow-500/90 hover:bg-yellow-400 border border-yellow-300 text-stone-950 text-[10px] sm:text-xs font-black shadow-lg active:scale-95 transition-all"
            >
              <span>🌊 Lanjut Adus ing Air Terjun</span>
              <span>➡</span>
            </Link>
          </div>
        )}
      </div>

      {/* Toast Feedback */}
      {toast && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-[90%] px-4 py-2.5 rounded-2xl border shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 text-xs sm:text-sm font-bold tracking-wide ${
            toast.type === 'success'
              ? 'bg-emerald-950/95 border-emerald-400 text-emerald-200'
              : 'bg-red-950/95 border-red-400 text-red-200'
          }`}
        >
          <span>{toast.text}</span>
          <button type="button" onClick={() => setToast(null)} className="text-stone-300 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Modal Berhasil Simpan */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-md font-sans">
          <div className="relative max-w-md w-full bg-stone-900 border-2 border-yellow-500/90 rounded-2xl p-6 shadow-2xl text-stone-100 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-3xl shadow-lg animate-bounce">
              🎉
            </div>
            <h3 className="mt-4 text-xl font-serif font-black text-yellow-400">
              Wangsulan Gladhen Kasil Disimpen!
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-stone-300 leading-relaxed font-serif">
              Matur nuwun! Cathetanmu babagan kegiatan ngumpulake lan ngracik gegodhongan jamu wis disimpen ing Dashboard Guru.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-2.5 justify-center">
              <button
                type="button"
                onClick={() => setShowSuccessModal(false)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-600 text-stone-300 font-bold text-xs transition cursor-pointer"
              >
                Deleng Tulisan
              </button>
              <Link
                href="/level2/grojogan"
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-stone-950 font-black text-xs shadow-lg active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <span>🌊</span> Lanjut Adus ing Air Terjun →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ringkesan Kegiatan Jamu */}
      {showStoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-md font-sans">
          <div className="relative max-w-lg w-full bg-stone-900 border-2 border-yellow-500/80 rounded-2xl p-6 shadow-2xl text-stone-100 space-y-3">
            <h3 className="text-xl font-serif font-black text-yellow-400 flex items-center gap-2">
              <span>📖</span> Ringkesan Kegiatan Ngumpulake &amp; Ngolah Jamu
            </h3>
            <div className="space-y-2 text-xs sm:text-sm text-stone-300 leading-relaxed font-serif">
              <p>• Sowan marang <strong>Resi Darmo</strong> ing Padhepokan Gunung Wilis.</p>
              <p>
                • Ngumpulake 4 jinis gegodhongan ing alas (masing-masing 3 lembar):{' '}
                <strong className="text-emerald-300">
                  Godhong Tapak Liman, Godhong Sirih, Godhong Sambiloto, lan Godhong Mindi
                </strong>.
              </p>
              <p>• Ngolah jamu kanthi urut: dikumbah resik, diiris cilik-cilik, diulek alus, lan digodhog nganti mateng banjur diunjuk bebarengan.</p>
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowStoryModal(false)}
                className="px-5 py-2 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-stone-950 font-bold text-xs shadow-md cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Petunjuk */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-md font-sans">
          <div className="relative max-w-md w-full bg-stone-900 border-2 border-yellow-500/80 rounded-2xl p-6 shadow-2xl text-stone-100 space-y-3">
            <h3 className="text-lg font-serif font-black text-yellow-400 flex items-center gap-2">
              <span>❓</span> Petunjuk Gladhen Nulis
            </h3>
            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed font-serif">
              1. Klik ing area garis kertas sisih tengen.<br />
              2. Tulisen kanthi 2–3 ukara babagan apa sing koklakoni lan godhong apa wae sing koktemokake kanggo ramuan jamu.<br />
              3. Pencet tombol ijo <strong>💾 Simpan</strong> kanggo nyimpen wangsulanmu!
            </p>
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="px-4 py-2 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-stone-950 font-black text-xs shadow-md cursor-pointer"
              >
                Ngerti
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
