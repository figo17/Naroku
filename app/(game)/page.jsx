'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function GameMainMenu() {
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [hoveredButton, setHoveredButton] = useState(null);

  return (
    <div className="relative w-screen h-screen bg-[#020b06] text-stone-100 flex flex-col items-center justify-center overflow-hidden select-none font-sans">
      {/* 
        CONTAINER 1024:410
        Menjamin koordinat hitbox transparan selalu 100% tepat presisi
        di atas tombol grafis pada gambar artwork di layar mana pun (HP, tablet, laptop, PC).
      */}
      <div className="relative w-full h-full max-w-[calc(100vh*1024/410)] max-h-[calc(100vw*410/1024)] aspect-[1024/410] overflow-hidden shadow-2xl">
        {/* Background Artwork Halaman Utama */}
        <Image
          src="/assets/backgrounds/landing-miwiti-dolanan.jpg"
          alt="Legenda Rara Kuning - Miwiti Dolanan"
          fill
          priority
          sizes="100vw"
          className="object-contain object-center"
        />

        {/* ========================================================
            TOP NAVBAR HITBOXES (Menimpa Navigasi Bawaan Gambar)
           ======================================================== */}
        
        {/* Logo / Brand -> Home */}
        <Link
          href="/"
          title="Legenda Rara Kuning"
          aria-label="Home"
          className="absolute left-[3.2%] top-[1.2%] w-[21%] h-[8%] rounded-md bg-transparent hover:bg-yellow-400/10 transition-all cursor-pointer z-30"
        />

        {/* Menu -> Beranda */}
        <Link
          href="/beranda"
          title="Menu Beranda"
          aria-label="Menu"
          className="absolute left-[29.8%] top-[1.2%] w-[4%] h-[8%] rounded-md bg-transparent hover:bg-yellow-400/15 hover:ring-1 hover:ring-yellow-300/40 transition-all cursor-pointer z-30"
        />

        {/* Materi -> Modul Materi Crita Legenda */}
        <Link
          href="/materi"
          title="Materi Crita Legenda"
          aria-label="Materi"
          className="absolute left-[34.3%] top-[1.2%] w-[4.6%] h-[8%] rounded-md bg-transparent hover:bg-yellow-400/15 hover:ring-1 hover:ring-yellow-300/40 transition-all cursor-pointer z-30"
        />

        {/* CP/TP -> Capaian lan Tujuan Pasinaon */}
        <Link
          href="/cptp"
          title="Capaian lan Tujuan Pasinaon (CP/TP)"
          aria-label="CP/TP"
          className="absolute left-[39.5%] top-[1.2%] w-[4.8%] h-[8%] rounded-md bg-transparent hover:bg-yellow-400/15 hover:ring-1 hover:ring-yellow-300/40 transition-all cursor-pointer z-30"
        />

        {/* Tokoh -> Level 1 Orientasi Tokoh */}
        <Link
          href="/level1"
          title="Tantangan Pangenalan Tokoh (Level 1)"
          aria-label="Tokoh"
          className="absolute left-[45.2%] top-[1.2%] w-[4.5%] h-[8%] rounded-md bg-transparent hover:bg-yellow-400/15 hover:ring-1 hover:ring-yellow-300/40 transition-all cursor-pointer z-30"
        />

        {/* Misi & Ngulandara -> Peta Petualangan */}
        <Link
          href="/peta"
          title="Peta Petualangan"
          aria-label="Peta Petualangan"
          className="absolute left-[54.0%] top-[1.2%] w-[8.2%] h-[8%] rounded-md bg-transparent hover:bg-yellow-400/15 hover:ring-1 hover:ring-yellow-300/40 transition-all cursor-pointer z-30"
        />

        {/* Evaluasi / Rekap Guru */}
        <Link
          href="/guru/rekap-level1"
          title="Evaluasi & Rekap Guru"
          aria-label="Evaluasi"
          className="absolute left-[75.0%] top-[1.2%] w-[6.8%] h-[8%] rounded-md bg-transparent hover:bg-yellow-400/15 hover:ring-1 hover:ring-yellow-300/40 transition-all cursor-pointer z-30"
        />

        {/* Audio / Speaker Toggle */}
        <button
          type="button"
          onClick={() => setAudioPlaying((prev) => !prev)}
          title={audioPlaying ? 'Pateni Swara' : 'Uripake Swara'}
          aria-label="Toggle Audio"
          className="absolute left-[91.5%] top-[1.2%] w-[4.5%] h-[8%] rounded-full bg-transparent hover:bg-yellow-400/20 hover:ring-1 hover:ring-yellow-300/50 transition-all cursor-pointer z-30 flex items-center justify-center"
        >
          {audioPlaying && (
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-ping opacity-75" />
          )}
        </button>

        {/* ========================================================
            MAIN ACTION BUTTONS (TRANSPARENT HITBOXES)
           ======================================================== */}

        {/* 1. TOMBOL: LOGIN MINANGKA GURU */}
        <Link
          href="/login?role=guru"
          onMouseEnter={() => setHoveredButton('guru')}
          onMouseLeave={() => setHoveredButton(null)}
          title="Login Minangka Guru"
          aria-label="Login Minangka Guru"
          className="absolute left-[20.6%] top-[61.5%] w-[28.5%] h-[24.8%] rounded-[24px] bg-transparent hover:bg-yellow-400/10 hover:ring-2 hover:ring-yellow-300/70 hover:shadow-[0_0_20px_rgba(250,204,21,0.4)] active:scale-[0.98] transition-all duration-150 cursor-pointer z-20 flex items-center justify-center group"
        >
          <span className="sr-only">Login Minangka Guru</span>
        </Link>

        {/* 2. TOMBOL: LOGIN MINANGKA SISWA */}
        <Link
          href="/login?role=murid"
          onMouseEnter={() => setHoveredButton('siswa')}
          onMouseLeave={() => setHoveredButton(null)}
          title="Login Minangka Siswa"
          aria-label="Login Minangka Siswa"
          className="absolute left-[50.4%] top-[61.5%] w-[28.8%] h-[24.8%] rounded-[24px] bg-transparent hover:bg-yellow-400/10 hover:ring-2 hover:ring-yellow-300/70 hover:shadow-[0_0_20px_rgba(250,204,21,0.4)] active:scale-[0.98] transition-all duration-150 cursor-pointer z-20 flex items-center justify-center group"
        >
          <span className="sr-only">Login Minangka Siswa</span>
        </Link>
      </div>

      {/* Petunjuk tampilan lanskap khusus layar portrait sempit */}
      <div className="absolute bottom-2 text-[10px] text-amber-200/60 sm:hidden pointer-events-none">
        💡 Putar piranti menyang posisi lanskap kanggo tampilan maksimal
      </div>
    </div>
  );
}
