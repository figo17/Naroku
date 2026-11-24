'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function Level2NanjakPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [studentProfile, setStudentProfile] = useState(null);
  const [audioPlaying, setAudioPlaying] = useState(false);

  // Essay / Tugas Nulis State
  const [answer, setAnswer] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  useEffect(() => {
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

        // Load existing saved answer for Lv 2 Nanjak
        const { data: savedData } = await supabase
          .from('level2_nanjak_answers')
          .select('answer')
          .eq('user_id', user.id)
          .maybeSingle();

        if (savedData?.answer) {
          setAnswer(savedData.answer);
        }
      } catch (err) {
        console.error('Error loading level 2 nanjak data:', err);
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
          answer: answer.trim(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

      if (error) {
        console.error('Supabase error saving nanjak answer:', error);
        setToast({
          type: 'error',
          text: 'Gagal nyimpen wangsulan. Coba priksa sambungan internetmu!',
        });
        setTimeout(() => setToast(null), 4000);
      } else {
        setToast({
          type: 'success',
          text: '✓ Wangsulan kasil disimpen menyang database guru!',
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
      <div className="w-screen h-screen bg-[#04120a] flex flex-col items-center justify-center text-yellow-400 gap-3 font-sans select-none">
        <div className="w-10 h-10 border-3 border-yellow-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm tracking-wide text-amber-200">Mbukak Tugas Nulis Lv 2: Nanjak...</p>
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen bg-[#04120a] text-stone-100 flex flex-col items-center justify-center overflow-hidden select-none font-sans">
      {/* 
        CONTAINER UTAMA 16:9 (1024 x 576)
        Menjamin koordinat textbox transparan & tombol presisi 100% di semua layar
      */}
      <div className="relative w-full h-full max-w-[calc(100vh*16/9)] max-h-[calc(100vw*9/16)] aspect-[16/9] overflow-hidden shadow-2xl select-none">
        {/* Artwork Utama Lv 2 Nanjak */}
        <Image
          src="/assets/level2/screen_nanjak_tugas_nulis.jpg"
          alt="Lv 2 - Nanjak: Tugas Nulis Rara Kuning lan Rara Runting"
          fill
          priority
          sizes="100vw"
          className="object-contain object-center"
        />

        {/* ========================================================
            TOP NAVBAR HITBOXES
           ======================================================== */}
        {/* Logo / Judul Kiri Atas -> Beranda */}
        <Link
          href="/"
          title="Legenda Rara Kuning - Bali menyang Beranda"
          className="absolute left-[2.5%] top-[1.5%] w-[18%] h-[8%] rounded-md bg-transparent hover:bg-yellow-400/10 cursor-pointer z-30"
        />

        {/* Top Right Icons: Buku (Cerita), Bantuan (?), Audio */}
        <button
          type="button"
          onClick={() => setShowStoryModal(true)}
          title="Waca Cengkorongan Cerita"
          className="absolute left-[83.8%] top-[2.0%] w-[4.0%] h-[7.0%] rounded-full bg-transparent hover:bg-yellow-400/20 cursor-pointer z-30 flex items-center justify-center"
        >
          <span className="sr-only">Buku Cerita</span>
        </button>

        <button
          type="button"
          onClick={() => setShowHelpModal(true)}
          title="Petunjuk Tugas Nulis"
          className="absolute left-[89.2%] top-[2.0%] w-[4.0%] h-[7.0%] rounded-full bg-transparent hover:bg-yellow-400/20 cursor-pointer z-30 flex items-center justify-center"
        >
          <span className="sr-only">Bantuan</span>
        </button>

        <button
          type="button"
          onClick={() => setAudioPlaying((p) => !p)}
          title={audioPlaying ? 'Pateni Swara' : 'Uripake Swara'}
          className="absolute left-[94.5%] top-[2.0%] w-[4.0%] h-[7.0%] rounded-full bg-transparent hover:bg-yellow-400/20 cursor-pointer z-30 flex items-center justify-center"
        >
          {audioPlaying && (
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-ping opacity-80" />
          )}
          <span className="sr-only">Audio</span>
        </button>

        {/* ========================================================
            TEXTBOX TRANSPARAN (TUGAS NULIS)
            Ditempatkan persis di atas garis-garis kartu kertas pada gambar
           ======================================================== */}
        <div className="absolute left-[45.2%] top-[46.0%] w-[51.0%] h-[32.5%] z-20">
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Tulis wangsulanmu ing kéné ..."
            className="w-full h-full bg-transparent text-amber-950 font-serif text-xs sm:text-sm md:text-base leading-relaxed sm:leading-[2.6rem] md:leading-[3.0rem] tracking-wide px-3 py-1.5 border-none outline-none focus:outline-none focus:ring-0 resize-none overflow-y-auto placeholder:text-stone-400/70 selection:bg-amber-300/40"
            style={{
              textShadow: '0 0 1px rgba(0,0,0,0.1)',
            }}
          />
        </div>

        {/* ========================================================
            TOMBOL TRANSPARAN: SIMPAN (💾 Simpan)
           ======================================================== */}
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          title={isSaving ? 'Nyimpen...' : 'Simpan Wangsulan Tugas Nulis'}
          className="absolute left-[60.5%] top-[83.3%] w-[25.4%] h-[10.4%] rounded-full bg-transparent hover:bg-yellow-400/25 hover:ring-2 hover:ring-yellow-300 hover:shadow-[0_0_25px_rgba(250,204,21,0.6)] active:scale-[0.98] transition-all duration-200 cursor-pointer z-30 flex items-center justify-center disabled:opacity-60"
        >
          {isSaving && (
            <span className="w-5 h-5 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
          )}
          <span className="sr-only">Simpan</span>
        </button>

        {/* Tombol Navigasi Bali & Lanjut di Pojok Bawah */}
        <div className="absolute bottom-2.5 left-4 right-4 z-30 flex items-center justify-between pointer-events-none">
          <Link
            href="/level2/orientasi/hasil"
            className="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-950/80 hover:bg-stone-900 border border-yellow-500/50 text-yellow-300 text-[10px] sm:text-xs font-bold backdrop-blur-md shadow-md active:scale-95 transition-all"
          >
            <span>⬅</span> Bali menyang Asil Perawatan
          </Link>

          {answer?.trim() && (
            <Link
              href="/level2/mucuk"
              className="pointer-events-auto flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-yellow-500/90 hover:bg-yellow-400 border border-yellow-300 text-stone-950 text-[10px] sm:text-xs font-black shadow-lg active:scale-95 transition-all animate-pulse"
            >
              <span>Banjur menyang Adegan Mucuk</span>
              <span>➡</span>
            </Link>
          )}
        </div>
      </div>

      {/* ========================================================
          TOAST FEEDBACK
         ======================================================== */}
      {toast && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-[90%] px-4 py-2.5 rounded-2xl border shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 text-xs sm:text-sm font-bold tracking-wide animate-fade-in ${
            toast.type === 'success'
              ? 'bg-emerald-950/95 border-emerald-400 text-emerald-200 shadow-emerald-900/50'
              : 'bg-red-950/95 border-red-400 text-red-200 shadow-red-900/50'
          }`}
        >
          <span>{toast.text}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="text-stone-300 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* ========================================================
          MODAL: BERHASIL SIMPAN & LANJUT KE PETA
         ======================================================== */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-md animate-fade-in font-sans">
          <div className="relative max-w-md w-full bg-stone-900 border-2 border-yellow-500/90 rounded-2xl p-6 shadow-2xl text-stone-100 text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-yellow-400/20 border-2 border-yellow-400 flex items-center justify-center text-3xl shadow-lg">
              ✨
            </div>
            <h3 className="mt-4 text-xl font-serif font-black text-yellow-400">
              Wangsulan Kasil Disimpen!
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-stone-300 leading-relaxed font-serif">
              Matur nuwun! Wangsulan babagan lara lan lelampahane Rara Kuning lan Rara Runting wis kacathet ing sistem guru.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row gap-2.5 justify-center">
              <button
                type="button"
                onClick={() => setShowSuccessModal(false)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-600 text-stone-300 font-bold text-xs transition"
              >
                Deleng Wangsulan
              </button>
              <Link
                href="/level2/mucuk"
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-stone-950 font-black text-xs shadow-lg active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <span>📜</span> Lanjut menyang Adegan Mucuk (Banjur →)
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: BUKU CERITA (RINGKESAN)
         ======================================================== */}
      {showStoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-md animate-fade-in font-sans">
          <div className="relative max-w-lg w-full bg-stone-900 border-2 border-yellow-500/80 rounded-2xl p-6 shadow-2xl text-stone-100">
            <h3 className="text-xl font-serif font-black text-yellow-400 flex items-center gap-2">
              <span>📖</span> Ringkesan Babagan Rara Kuning & Rara Runting
            </h3>
            <div className="mt-4 space-y-3 text-xs sm:text-sm text-stone-300 leading-relaxed font-serif">
              <p>
                <strong>Rara Kuning (Dewi Sekartaji):</strong> Nandhang lelara gondhok ing gulu lan kulite dadi sisik sarta gatel-gatel.
              </p>
              <p>
                <strong>Rara Runting (Dewi Kilisuci):</strong> Nandhang lelara kuning, kulite lan mripate katon kuning.
              </p>
              <p className="p-3 rounded-xl bg-amber-950/50 border border-yellow-500/40 text-yellow-200">
                Senadyan wis nindakake maneka warna perawatan tradhisional nganggo jamu, lulur, lan adus banyu kembang ing kraton, kahanane durung mari sakabehe. Mula saka iku, para putri kudu ngupaya golek usada menyang pertapan ing lereng Gunung Wilis.
              </p>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setShowStoryModal(false)}
                className="px-5 py-2 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-stone-950 font-bold text-xs shadow-md"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: BANTUAN TUGAS NULIS
         ======================================================== */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-md animate-fade-in font-sans">
          <div className="relative max-w-md w-full bg-stone-900 border-2 border-yellow-500/80 rounded-2xl p-6 shadow-2xl text-stone-100">
            <h3 className="text-lg font-serif font-black text-yellow-400 flex items-center gap-2">
              <span>❓</span> Petunjuk Tugas Nulis
            </h3>
            <p className="mt-3 text-xs sm:text-sm text-stone-300 leading-relaxed font-serif">
              1. Klik ing area garis kartu sisih tengen.<br />
              2. Tulisen nganggo 2-3 ukara babagan apa sing dialami dening Rara Kuning lan Rara Runting.<br />
              3. Klik tombol <strong>Simpan</strong> ing ngisor kanggo nyimpen wangsulanmu.
            </p>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="px-4 py-2 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-stone-950 font-black text-xs shadow-md"
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
