'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function Level2MucukPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [studentProfile, setStudentProfile] = useState(null);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [showStoryModal, setShowStoryModal] = useState(false);

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
        console.error('Error loading level 2 mucuk data:', err);
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
        <p className="text-sm tracking-wide text-amber-200">Mbukak Adegan Lv 2: Mucuk...</p>
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen bg-[#04120a] text-stone-100 flex flex-col items-center justify-center overflow-hidden select-none font-sans">
      {/* 
        CONTAINER 1024 x 448
        Menjamin koordinat hitbox transparan selalu 100% tepat presisi
        di atas tombol grafis pada gambar artwork di layar mana pun (HP, tablet, laptop, PC).
      */}
      <div className="relative w-full h-full max-w-[calc(100vh*1024/448)] max-h-[calc(100vw*448/1024)] aspect-[1024/448] overflow-hidden shadow-2xl select-none">
        {/* Artwork Utama Lv 2 Mucuk */}
        <Image
          src="/assets/level2/screen_mucuk.jpg"
          alt="Lv 2 - Mucuk: Pamitan Rara Kuning lan Rara Runting menyang Alas Gunung Wilis"
          fill
          priority
          sizes="100vw"
          className="object-contain object-center"
        />

        {/* ========================================================
            TOP BANNER HITBOX: LV 2 - MUCUK
           ======================================================== */}
        <div
          onClick={() => setShowStoryModal(true)}
          title="Klik kanggo maca katrangan adegan Mucuk"
          className="absolute left-[38.0%] top-[0.5%] w-[24.0%] h-[9.0%] rounded-md bg-transparent hover:bg-yellow-400/10 cursor-pointer z-30"
        />

        {/* ========================================================
            TOMBOL TRANSPARAN: BANJUR ▶▶ (DI DALAM KOTAK DIALOG)
            Koordinat presisi: left: 67.9%, top: 86.8%, width: 9.2%, height: 7.0%
           ======================================================== */}
        <button
          type="button"
          onClick={() => router.push('/level2/alas')}
          title="Banjur menyang Alas Gunung Wilis"
          className="absolute left-[67.9%] top-[86.8%] w-[9.2%] h-[7.0%] rounded-lg bg-transparent hover:bg-yellow-400/25 hover:ring-2 hover:ring-yellow-300 hover:shadow-[0_0_20px_rgba(250,204,21,0.7)] active:scale-[0.96] transition-all duration-200 cursor-pointer z-30 flex items-center justify-center"
        >
          <span className="sr-only">Banjur</span>
        </button>

        {/* ========================================================
            D-PAD NAVIGASI DI KIRI BAWAH
            (Tombol Kiri: Kembali ke Nanjak, Tombol Kanan: Banjur ke Alas)
           ======================================================== */}
        {/* Tombol Kiri (⬅) */}
        <button
          type="button"
          onClick={() => router.push('/level2/nanjak')}
          title="Bali menyang Tugas Nulis (Nanjak)"
          className="absolute left-[0.9%] top-[77.0%] w-[4.0%] h-[15.0%] rounded-lg bg-transparent hover:bg-yellow-400/20 active:scale-95 transition-all cursor-pointer z-30"
        >
          <span className="sr-only">Bali</span>
        </button>

        {/* Tombol Kanan (➡) */}
        <button
          type="button"
          onClick={() => router.push('/level2/alas')}
          title="Banjur menyang Alas Gunung Wilis"
          className="absolute left-[9.7%] top-[77.0%] w-[4.0%] h-[15.0%] rounded-lg bg-transparent hover:bg-yellow-400/20 active:scale-95 transition-all cursor-pointer z-30"
        >
          <span className="sr-only">Banjur</span>
        </button>

        {/* ========================================================
            BUBBLE PERCAKAPAN INTERAKTIF (KLIK UNTUK MODAL)
           ======================================================== */}
        {/* Bubble Rara Kuning */}
        <div
          onClick={() => setShowStoryModal(true)}
          title="Klik kanggo maca dialog Rara Kuning"
          className="absolute left-[6.8%] top-[23.0%] w-[20.5%] h-[20.0%] rounded-2xl bg-transparent hover:bg-yellow-400/10 cursor-pointer z-20"
        />

        {/* Bubble Rara Runting */}
        <div
          onClick={() => setShowStoryModal(true)}
          title="Klik kanggo maca dialog Rara Runting"
          className="absolute left-[27.6%] top-[27.5%] w-[14.5%] h-[17.0%] rounded-2xl bg-transparent hover:bg-yellow-400/10 cursor-pointer z-20"
        />

        {/* Tombol Pojok Bawah: Navigasi Cepat */}
        <div className="absolute bottom-2 left-4 z-30">
          <Link
            href="/level2/nanjak"
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-950/85 hover:bg-stone-900 border border-yellow-500/50 text-yellow-300 text-[10px] sm:text-xs font-bold backdrop-blur-md shadow-md active:scale-95 transition-all"
          >
            <span>⬅</span> Bali menyang Tugas Nulis (Nanjak)
          </Link>
        </div>
      </div>

      {/* ========================================================
          MODAL: KATRANGAN ADEGAN MUCUK
         ======================================================== */}
      {showStoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-md animate-fade-in font-sans">
          <div className="relative max-w-lg w-full bg-stone-900 border-2 border-yellow-500/80 rounded-2xl p-6 shadow-2xl text-stone-100">
            <h3 className="text-xl font-serif font-black text-yellow-400 flex items-center gap-2">
              <span>📜</span> Katrangan Adegan: Lv 2 - Mucuk
            </h3>
            <div className="mt-4 space-y-3 text-xs sm:text-sm text-stone-300 leading-relaxed font-serif">
              <p>
                <strong>Klimaks Lelampahan:</strong> Amarga perawatan nganggo jamu lan adus ing kraton ora bisa ngilangi larané, Putri Rara Kuning lan Putri Rara Runting mutusake kanggo ngumbara lan tapa brata menyang alas lereng Gunung Wilis.
              </p>
              <div className="p-3.5 rounded-xl bg-amber-950/50 border border-yellow-500/40 text-yellow-200 space-y-1.5">
                <p>
                  <strong>Putri Rara Kuning:</strong> &ldquo;Adhiku... ayo awakdhewe ngumbara ing alas Gunung Wilis, supaya bisa pikantuk tamba.&rdquo;
                </p>
                <p>
                  <strong>Putri Rara Runting:</strong> &ldquo;Iya Mbakyu.. ayo!&rdquo;
                </p>
                <p className="text-stone-300 pt-1 border-t border-amber-800/60">
                  <strong>Prajurit Kraton:</strong> &ldquo;Mugi putri tansah dipunparingi keslametan dening Gusti Allah nalikane ngumbara menyang alas Gunung Wilis.&rdquo;
                </p>
              </div>
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
                onClick={() => router.push('/level2/alas')}
                className="px-5 py-2 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-stone-950 font-black text-xs shadow-md active:scale-95 transition"
              >
                Banjur menyang Alas Gunung Wilis →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
