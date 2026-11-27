'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function ProfilPengembangPage() {
  const router = useRouter();
  const [audioPlaying, setAudioPlaying] = useState(false);

  useEffect(() => {
    router.prefetch('/peta');
    router.prefetch('/beranda');
  }, [router]);

  return (
    <div className="relative w-screen h-screen bg-[#03150c] text-stone-100 flex flex-col items-center justify-between overflow-hidden select-none font-sans">
      {/* Ambient Blurred Backdrop */}
      <Image
        src="/assets/materi/slide-6-profil-pengembang.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center blur-xl scale-110 opacity-45 pointer-events-none"
      />

      {/* Container Utama 4:3 (1024 x 768) */}
      <div className="relative z-10 flex-1 w-full flex items-center justify-center px-2 pt-2 pb-1 overflow-hidden">
        <div
          className="relative w-full h-full shadow-2xl overflow-hidden rounded-lg"
          style={{
            aspectRatio: '1024 / 768',
            maxWidth: 'calc((100vh - 58px) * 1024 / 768)',
            maxHeight: 'calc(100vw * 768 / 1024)',
          }}
        >
          <Image
            src="/assets/materi/slide-6-profil-pengembang.jpg"
            alt="Profil Pengembang Game Rara Kuning – Melani Widyah Dwi Nurreira"
            fill
            priority
            sizes="100vw"
            className="object-contain object-center"
          />

          {/* ===== TOP NAVBAR HITBOXES ===== */}
          <Link
            href="/beranda"
            title="Beranda"
            className="absolute left-[2.2%] top-[1.0%] w-[21.0%] h-[5.6%] rounded-md bg-transparent hover:bg-yellow-400/10 cursor-pointer z-30"
          />
          <Link
            href="/beranda"
            title="Menu Beranda"
            className="absolute left-[26.2%] top-[1.8%] w-[4.5%] h-[4.2%] rounded-md bg-transparent hover:bg-yellow-400/15 cursor-pointer z-30"
          />
          <Link
            href="/materi"
            title="Materi"
            className="absolute left-[31.8%] top-[1.8%] w-[5.0%] h-[4.2%] rounded-md bg-transparent hover:bg-yellow-400/15 cursor-pointer z-30"
          />
          <Link
            href="/cptp"
            title="CP/TP"
            className="absolute left-[37.8%] top-[1.8%] w-[4.8%] h-[4.2%] rounded-md bg-transparent hover:bg-yellow-400/15 cursor-pointer z-30"
          />
          <Link
            href="/materi?slide=4"
            title="Tokoh"
            className="absolute left-[43.5%] top-[1.8%] w-[4.8%] h-[4.2%] rounded-md bg-transparent hover:bg-yellow-400/15 cursor-pointer z-30"
          />
          <Link
            href="/peta"
            title="Peta Petualangan"
            className="absolute left-[49.0%] top-[1.8%] w-[11.5%] h-[4.2%] rounded-md bg-transparent hover:bg-yellow-400/15 cursor-pointer z-30"
          />
          <Link
            href="/level3/simpanan"
            title="Jurnal – Simpanan Jawaban"
            className="absolute left-[61.2%] top-[1.8%] w-[5.2%] h-[4.2%] rounded-md bg-transparent hover:bg-yellow-400/15 cursor-pointer z-30"
          />
          <Link
            href="/level2/grojogan"
            title="Grojogan Rara Kuning"
            className="absolute left-[67.2%] top-[1.8%] w-[6.5%] h-[4.2%] rounded-md bg-transparent hover:bg-yellow-400/15 cursor-pointer z-30"
          />
          <Link
            href="/level3/piyeulan"
            title="Evaluasi Piyeulan"
            className="absolute left-[74.5%] top-[1.8%] w-[6.5%] h-[4.2%] rounded-md bg-transparent hover:bg-yellow-400/15 cursor-pointer z-30"
          />

          {/* Speaker */}
          <button
            type="button"
            onClick={() => setAudioPlaying((p) => !p)}
            title={audioPlaying ? 'Pateni Swara' : 'Uripake Swara'}
            className="absolute left-[83.4%] top-[1.4%] w-[3.8%] h-[4.8%] rounded-full bg-transparent hover:bg-yellow-400/20 cursor-pointer z-30 flex items-center justify-center"
          >
            {audioPlaying && (
              <span className="w-2 h-2 rounded-full bg-yellow-400 animate-ping" />
            )}
            <span className="sr-only">Swara</span>
          </button>

          {/* Tombol Transparan Presisi "⬅ Bali" ing Pojok Tengen Ndhuwur Gambar */}
          <button
            type="button"
            onClick={() => router.back()}
            title="Bali"
            aria-label="Bali"
            className="absolute left-[88.8%] top-[1.4%] w-[8.8%] h-[4.8%] rounded-full bg-transparent hover:bg-yellow-400/20 hover:ring-2 hover:ring-yellow-300 active:scale-95 transition-all cursor-pointer z-35"
          >
            <span className="sr-only">Bali</span>
          </button>
        </div>
      </div>

      {/* Bar Navigasi Bawah Tanpa Modal */}
      <div className="relative z-20 w-full px-4 sm:px-8 py-2 bg-[#021009]/90 border-t border-emerald-900/60 backdrop-blur-md flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 sm:px-5 py-1.5 rounded-full bg-stone-900 hover:bg-stone-800 border border-yellow-500/60 text-yellow-300 font-bold text-xs sm:text-sm shadow active:scale-95 transition cursor-pointer flex items-center gap-1.5"
        >
          <span>⬅</span>
          <span>Balik</span>
        </button>

        <span className="text-[11px] sm:text-xs font-serif font-bold text-amber-300">
          Profil Pengembang • Rara Kuning
        </span>

        <div className="flex items-center gap-2">
          <Link
            href="/beranda"
            className="px-4 py-1.5 rounded-full bg-emerald-900/90 hover:bg-emerald-800 border border-emerald-400/60 text-emerald-100 font-bold text-xs sm:text-sm shadow active:scale-95 transition"
          >
            🏠 Beranda
          </Link>
          <Link
            href="/peta"
            className="px-5 py-1.5 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 border border-yellow-200 text-stone-950 font-black text-xs sm:text-sm shadow-lg active:scale-95 transition flex items-center gap-1.5"
          >
            <span>🗺️ Peta Petualangan</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
