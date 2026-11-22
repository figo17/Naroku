'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function GameMainMenu() {
  return (
    <div className="relative w-full h-full min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden">
      {/* Background Ilustrasi Grojogan Rara Kuning */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/assets/backgrounds/grojogan-rara-kuning.jpg"
          alt="Latar Belakang Grojogan Rara Kuning"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        {/* Soft Vignette & Dark Overlay for contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/85 via-stone-950/40 to-stone-950/60" />
      </div>

      {/* Main Container Card */}
      <div className="relative z-10 max-w-lg w-full flex flex-col items-center text-center gap-5 p-6 sm:p-8 rounded-3xl bg-stone-950/80 backdrop-blur-md border-2 border-yellow-500/60 shadow-2xl">
        
        {/* Title Badge */}
        <div className="px-4 py-1.5 rounded-full bg-amber-950/90 border border-yellow-500/60 text-yellow-300 text-xs font-semibold uppercase tracking-widest shadow-inner">
          Media Pasinaon Basa Jawa Interaktif
        </div>

        {/* Game Title */}
        <div className="flex flex-col items-center gap-1.5">
          <h1 className="text-3xl sm:text-5xl font-black font-serif tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-yellow-100 via-amber-300 to-yellow-500 drop-shadow-md">
            HAROKU ADVENTURE
          </h1>
          <p className="text-xs sm:text-sm font-serif italic text-amber-200/90 max-w-md">
            &quot;Mula Bukan Grojogan Rara Kuning & Petualangan Dewi Kilisuci&quot;
          </p>
        </div>

        {/* Character Illustration Banner */}
        <div className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-950/80 via-stone-900/90 to-emerald-950/80 border border-amber-600/50 flex items-center justify-around shadow-inner">
          <div className="flex flex-col items-center">
            <span className="text-3xl sm:text-4xl drop-shadow">👸</span>
            <span className="text-[11px] text-amber-200 font-bold mt-1">Dewi Kilisuci</span>
          </div>
          <div className="text-sm text-yellow-500 font-bold opacity-80">✦</div>
          <div className="flex flex-col items-center">
            <span className="text-3xl sm:text-4xl drop-shadow">👑</span>
            <span className="text-[11px] text-yellow-300 font-bold mt-1">Putri Rara Kuning</span>
          </div>
          <div className="text-sm text-yellow-500 font-bold opacity-80">✦</div>
          <div className="flex flex-col items-center">
            <span className="text-3xl sm:text-4xl drop-shadow">🌊</span>
            <span className="text-[11px] text-cyan-300 font-bold mt-1">Grojogan Suci</span>
          </div>
        </div>

        {/* Role Action Buttons */}
        <div className="w-full flex flex-col gap-3.5 mt-1">
          {/* Tombol Siswa */}
          <Link
            href="/login?role=murid"
            className="group relative w-full h-16 sm:h-20 rounded-2xl overflow-hidden border-2 border-yellow-500/80 shadow-lg hover:shadow-yellow-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 bg-emerald-950"
          >
            <Image
              src="/assets/buttons/btn-login-siswa.png"
              alt="Login Minangka Siswa"
              fill
              priority
              sizes="(max-width: 640px) 100vw, 480px"
              className="object-cover object-center group-hover:brightness-105 transition-all"
            />
          </Link>

          {/* Tombol Guru */}
          <Link
            href="/login?role=guru"
            className="group relative w-full h-16 sm:h-20 rounded-2xl overflow-hidden border-2 border-yellow-500/80 shadow-lg hover:shadow-yellow-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 bg-emerald-950"
          >
            <Image
              src="/assets/buttons/btn-login-guru-clean.png"
              alt="Login Minangka Guru"
              fill
              priority
              sizes="(max-width: 640px) 100vw, 480px"
              className="object-cover object-center group-hover:brightness-105 transition-all"
            />
          </Link>

          {/* Tombol Khusus Capaian & Tujuan Pasinaon (CP/TP) */}
          <Link
            href="/cptp"
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-900 hover:from-emerald-800 hover:to-emerald-700 border-2 border-emerald-500/80 text-yellow-300 font-bold text-xs sm:text-sm shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <span className="text-base">📖</span>
            <span>Capaian lan Tujuan Pasinaon (CP/TP)</span>
            <span className="text-yellow-400 font-bold ml-1">→</span>
          </Link>

          {/* Navigasi Tambahan */}
          <div className="w-full mt-1">
            <Link
              href="/play"
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-500 border border-yellow-400 text-yellow-100 font-bold text-xs sm:text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span>▶</span> Langsung Main Petualangan
            </Link>
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-1 text-center">
          <p className="text-[11px] text-stone-300 font-sans">
            Aplikasi Pasinaon Carita Rakyat Jawa Kanthi Petualangan 2D
          </p>
        </div>
      </div>
    </div>
  );
}
