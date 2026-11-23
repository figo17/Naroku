'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function CpTpPage() {
  return (
    <div className="relative w-full min-h-screen bg-[#061e12] text-stone-100 flex flex-col font-sans select-none overflow-x-hidden">
      {/* Background Graphic / Ambient Elements */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <Image
          src="/assets/backgrounds/grojogan-rara-kuning.jpg"
          alt="Latar Belakang"
          fill
          priority
          className="object-cover object-center filter blur-sm"
        />
        <div className="absolute inset-0 bg-[#061e12]/80" />
      </div>

      {/* Cloud / Mega Mendung Batik Ornaments */}
      <div className="absolute top-24 left-2 w-32 h-32 opacity-20 pointer-events-none text-emerald-300">
        <svg viewBox="0 0 100 100" fill="currentColor">
          <path d="M20,50 Q30,30 50,40 Q70,20 80,45 Q95,50 85,70 Q70,90 50,75 Q30,85 15,65 Z" />
        </svg>
      </div>
      <div className="absolute bottom-12 right-4 w-40 h-40 opacity-20 pointer-events-none text-emerald-300">
        <svg viewBox="0 0 100 100" fill="currentColor">
          <path d="M20,50 Q30,30 50,40 Q70,20 80,45 Q95,50 85,70 Q70,90 50,75 Q30,85 15,65 Z" />
        </svg>
      </div>

      {/* TOP NAVBAR (Identik dengan Header Desain) */}
      <header className="relative z-10 w-full bg-[#03150c]/90 border-b border-emerald-900/60 backdrop-blur-md px-4 sm:px-8 py-3 flex items-center justify-between shadow-lg">
        {/* Logo & Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-yellow-400 border-2 border-yellow-200 flex items-center justify-center shadow-md">
            <span className="text-xl">🔺</span>
          </div>
          <div className="flex flex-col">
            <span className="font-serif font-black tracking-wider text-yellow-400 text-lg sm:text-xl leading-none">
              RARA KUNING
            </span>
            <span className="text-[10px] sm:text-xs text-emerald-400 font-medium tracking-wide">
              Legenda Gunung Wilis Nganjuk
            </span>
          </div>
        </div>

        {/* Breadcrumbs Navigation */}
        <nav className="hidden lg:flex items-center gap-2 text-xs font-medium text-emerald-300/80">
          <Link href="/beranda" className="hover:text-yellow-400 transition-colors">Menu</Link>
          <span>›</span>
          <span className="hover:text-yellow-400 transition-colors cursor-pointer">Materi</span>
          <span>›</span>
          <span className="text-yellow-400 font-bold border-b border-yellow-400 pb-0.5">CP/TP</span>
          <span>›</span>
          <Link href="/peta" className="hover:text-yellow-400 transition-colors">Peta Petualangan</Link>
          <span>›</span>
          <Link href="/play" className="hover:text-yellow-400 transition-colors">Ngulandara</Link>
          <span>›</span>
          <span className="hover:text-yellow-400 transition-colors cursor-pointer">Jurnal</span>
          <span>›</span>
          <span className="hover:text-yellow-400 transition-colors cursor-pointer">Grojogan</span>
          <span>›</span>
          <span className="hover:text-yellow-400 transition-colors cursor-pointer">Evaluasi</span>
        </nav>

        {/* Audio Speaker Icon Button */}
        <div className="flex items-center gap-2">
          <button 
            type="button"
            className="w-9 h-9 rounded-full bg-emerald-950/80 border border-yellow-500/50 flex items-center justify-center text-yellow-400 hover:scale-105 active:scale-95 transition-transform shadow"
            title="Audio / Swara"
          >
            🔊
          </button>
        </div>
      </header>

      {/* MAIN CONTENT BOARD (Bingkai Hijau Klasik) */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-5xl bg-[#082819]/90 border-2 border-emerald-600/70 rounded-3xl p-6 sm:p-9 shadow-2xl backdrop-blur-md relative">
          
          {/* Header Bagian Atas Box */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-emerald-800/40">
            <div>
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-1.5">
                <span>📖</span> PEDOMAN PASINAON
              </div>
              <h1 className="text-2xl sm:text-4xl font-serif font-black tracking-wide text-white drop-shadow">
                CAPAIAN LAN TUJUAN PASINAON
              </h1>
              <p className="text-xs sm:text-sm text-emerald-200/90 mt-1">
                Target kompetensi literasi nulis narasi crita babad & nilai karakter.
              </p>
            </div>

            {/* Tombol Bali (Kembali) */}
            <Link
              href="/"
              className="self-start sm:self-center px-6 py-2.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-stone-950 font-bold text-sm shadow-lg hover:shadow-yellow-500/30 flex items-center gap-2 transition-all active:scale-95 border border-yellow-200"
            >
              <span>⬅</span> Bali
            </Link>
          </div>

          {/* Grid Dua Kolom (CP & TP) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            
            {/* KARTU KIRI: CAPAIAN PASINAON (CP) */}
            <div className="bg-[#051a10]/80 border border-emerald-500/60 rounded-2xl p-6 flex flex-col gap-4 shadow-inner">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-emerald-800/70 border border-emerald-400/60 flex flex-col items-center justify-center text-emerald-200 shadow">
                  <span className="text-base leading-none">📖</span>
                  <span className="text-[10px] font-black tracking-tighter mt-0.5">CP</span>
                </div>
                <h2 className="text-lg sm:text-xl font-serif font-bold text-yellow-400 tracking-wide">
                  CAPAIAN PASINAON (CP)
                </h2>
              </div>

              <div className="text-xs sm:text-sm text-stone-200 leading-relaxed space-y-2.5 text-justify">
                <p>
                  Peserta didik mampu menulis gagasan, pikiran, pandangan, pengetahuan metakognisi untuk berbagai tujuan secara logis, kritis, dan kreatif.{' '}
                  <span className="text-yellow-300 font-semibold bg-yellow-950/40 px-1 rounded">
                    Peserta didik mampu menulis berbagai teks fiksi dan non fiksi.
                  </span>{' '}
                  Peserta didik mampu menulis teks beraksara carakan Jawa/ carakan Madhurâ dan cerkak/carêta pandâ&apos;. Peserta didik mampu menerbitkan tulisan hasil karyanya di medhia cetak maupun digital.
                </p>
              </div>
            </div>

            {/* KARTU KANAN: TUJUAN PASINAON (TP) */}
            <div className="bg-[#051a10]/80 border border-yellow-600/60 rounded-2xl p-6 flex flex-col gap-4 shadow-inner">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-amber-900/60 border border-yellow-500/60 flex items-center justify-center text-yellow-400 text-xl shadow">
                  🎯
                </div>
                <h2 className="text-lg sm:text-xl font-serif font-bold text-yellow-400 tracking-wide">
                  TUJUAN PASINAON (TP)
                </h2>
              </div>

              <div className="flex flex-col gap-3.5 mt-1">
                {/* Item A */}
                <div className="flex items-start gap-3 text-xs sm:text-sm text-stone-200">
                  <div className="w-6 h-6 rounded-full bg-yellow-500 text-stone-950 font-black text-xs flex items-center justify-center shrink-0 mt-0.5 shadow">
                    a
                  </div>
                  <p className="leading-relaxed">
                    Peserta didik (A) mampu mengenali struktur dalam crita Legenda asal-usul air terjun Rara Kuning (B).
                  </p>
                </div>

                {/* Item B */}
                <div className="flex items-start gap-3 text-xs sm:text-sm text-stone-200">
                  <div className="w-6 h-6 rounded-full bg-yellow-500 text-stone-950 font-black text-xs flex items-center justify-center shrink-0 mt-0.5 shadow">
                    b
                  </div>
                  <p className="leading-relaxed">
                    Peserta didik (A) mampu mengerti isi crita Legenda asal-usul air terjun Rara Kuning (B).
                  </p>
                </div>

                {/* Item C */}
                <div className="flex items-start gap-3 text-xs sm:text-sm text-stone-200">
                  <div className="w-6 h-6 rounded-full bg-yellow-500 text-stone-950 font-black text-xs flex items-center justify-center shrink-0 mt-0.5 shadow">
                    c
                  </div>
                  <p className="leading-relaxed">
                    Peserta didik (A) mampu mengembangkan gagasan berdasarkan crita Legenda asal-usul air terjun Rara Kuning dengan runtut lan logis.
                  </p>
                </div>
              </div>
            </div>

          </div>

        </div>
      </main>

      {/* FOOTER */}
      <footer className="relative z-10 w-full py-2.5 text-center text-[11px] text-emerald-400/60 bg-[#03150c]/80 border-t border-emerald-950">
        Haroku Adventure • Pasinaon Basa Jawa Legenda Mula Bukan Grojogan Rara Kuning
      </footer>
    </div>
  );
}
