'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function Level2OrientasiHasilPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [studentProfile, setStudentProfile] = useState(null);
  const [audioPlaying, setAudioPlaying] = useState(false);
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
      } catch (err) {
        console.error('Error loading level 2 hasil orientasi data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router, supabase]);

  if (loading) {
    return (
      <div className="w-screen h-screen bg-[#04120a] flex flex-col items-center justify-center text-yellow-400 gap-3 font-sans select-none">
        <div className="w-10 h-10 border-3 border-yellow-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm tracking-wide text-amber-200">Mbukak Asil Perawatan...</p>
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen bg-[#04120a] text-stone-100 flex flex-col items-center justify-center overflow-hidden select-none font-sans">
      {/* 
        CONTAINER UTAMA 16:9 (1024 x 576)
        Menjamin koordinat hitbox dan visual 100% presisi di layar mana pun
      */}
      <div className="relative w-full h-full max-w-[calc(100vh*16/9)] max-h-[calc(100vw*9/16)] aspect-[16/9] overflow-hidden shadow-2xl select-none">
        {/* Background Artwork Asil Perawatan */}
        <Image
          src="/assets/level2/screen_orientasi_hasil.jpg"
          alt="Level 2: Orientasi - Asil Perawatan Rara Kuning lan Rara Runting"
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
          title="Waca Cengkorongan Asil Perawatan"
          className="absolute left-[83.8%] top-[2.0%] w-[4.0%] h-[7.0%] rounded-full bg-transparent hover:bg-yellow-400/20 cursor-pointer z-30 flex items-center justify-center"
        >
          <span className="sr-only">Buku Cerita</span>
        </button>

        <button
          type="button"
          onClick={() => setShowHelpModal(true)}
          title="Petunjuk Katrangan"
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
            INTERACTIVE HITBOXES UNTUK KOTAK ASIL PERAWATAN (KIRI)
           ======================================================== */}
        <div
          onClick={() => setShowStoryModal(true)}
          title="Klik kanggo maca katrangan luwih jero"
          className="absolute left-[1.3%] top-[11.2%] w-[19.8%] h-[30.5%] rounded-2xl bg-transparent hover:bg-yellow-400/10 cursor-pointer z-20 transition-all"
        />

        <div
          onClick={() => setShowStoryModal(true)}
          title="Klik kanggo maca katrangan luwih jero"
          className="absolute left-[1.3%] top-[46.2%] w-[19.8%] h-[21.0%] rounded-2xl bg-transparent hover:bg-yellow-400/10 cursor-pointer z-20 transition-all"
        />

        {/* ========================================================
            TOMBOL TRANSPARAN: BANJUR > (KANAN BAWAH)
           ======================================================== */}
        <button
          type="button"
          onClick={() => router.push('/peta')}
          title="Banjur menyang Peta Petualangan / Tahap Sabanjure"
          className="absolute left-[84.5%] top-[88.0%] w-[14.0%] h-[8.8%] rounded-full bg-transparent hover:bg-yellow-400/25 hover:ring-2 hover:ring-yellow-300 hover:shadow-[0_0_25px_rgba(250,204,21,0.6)] active:scale-[0.97] transition-all duration-200 cursor-pointer z-30 flex items-center justify-center"
        >
          <span className="sr-only">Banjur</span>
        </button>

        {/* Tombol Navigasi Cilik Bali menyang Pasinaon Perawatan (Kiri Bawah) */}
        <div className="absolute bottom-2.5 left-4 z-30">
          <Link
            href="/level2/orientasi"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-950/80 hover:bg-stone-900 border border-yellow-500/50 text-yellow-300 text-[10px] sm:text-xs font-bold backdrop-blur-md shadow-md active:scale-95 transition-all"
          >
            <span>⬅</span> Bali menyang Pilihan Perawatan
          </Link>
        </div>
      </div>

      {/* ========================================================
          MODAL: KATRANGAN ASIL PERAWATAN
         ======================================================== */}
      {showStoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-md animate-fade-in font-sans">
          <div className="relative max-w-lg w-full bg-stone-900 border-2 border-yellow-500/80 rounded-2xl p-6 shadow-2xl text-stone-100">
            <h3 className="text-xl font-serif font-black text-yellow-400 flex items-center gap-2">
              <span>📜</span> Katrangan Asil Perawatan
            </h3>
            <div className="mt-4 space-y-3 text-xs sm:text-sm text-stone-300 leading-relaxed font-serif">
              <p>
                Sawise Rara Kuning lan Rara Runting nyoba maneka warna jamu lan adus nganggo banyu kembang sarta rempah-rempah tradhisional ing kraton, kahanane durung bisa pulih kaya sakawit.
              </p>
              <p className="p-3 rounded-xl bg-amber-950/50 border border-yellow-500/40 text-yellow-200">
                Penyakité isih manggon ing awake para putri. Mula saka iku, kudu ana lelampahan anyar kanggo nggolèk tamba sing luwih mandi ing njaba kraton...
              </p>
            </div>
            <div className="mt-6 flex justify-between items-center">
              <button
                type="button"
                onClick={() => setShowStoryModal(false)}
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => router.push('/peta')}
                className="px-5 py-2 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-stone-950 font-black text-xs shadow-md active:scale-95 transition"
              >
                Banjur (Nglajengake) →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: BANTUAN & PANDUAN
         ======================================================== */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-md animate-fade-in font-sans">
          <div className="relative max-w-md w-full bg-stone-900 border-2 border-yellow-500/80 rounded-2xl p-6 shadow-2xl text-stone-100">
            <h3 className="text-lg font-serif font-black text-yellow-400 flex items-center gap-2">
              <span>❓</span> Petunjuk Pasinaon
            </h3>
            <p className="mt-3 text-xs sm:text-sm text-stone-300 leading-relaxed font-serif">
              Wacanen katrangan asil perawatan ing kothak sisih kiwa. Klik tombol <strong>Banjur &gt;</strong> ing pojok tengen ngisor kanggo nglajengake lelampahan crita menyang tahap sabanjure!
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
