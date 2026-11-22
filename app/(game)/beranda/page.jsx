'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function StudentHomePage() {
  const router = useRouter();
  const supabase = createClient();
  const [studentProfile, setStudentProfile] = useState(null);
  const [audioPlaying, setAudioPlaying] = useState(false);

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login?role=murid');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        setStudentProfile(profile);
      }
    }

    loadUser();
  }, [router, supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="relative w-full min-h-screen bg-[#061e12] text-stone-100 flex flex-col font-sans select-none overflow-x-hidden">
      {/* 
        BACKGROUND:
        Gambar lanskap asli utuh yang sudah memiliki tombol grafis
        "MIWITI DOLANAN" dan "CP LAN TUJUAN PASINAON" di dalamnya.
      */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/assets/backgrounds/student-home-hero.jpg"
          alt="Latar Belakang Legenda Rara Kuning"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
      </div>

      {/* TOP NAVBAR */}
      <header className="relative z-20 w-full bg-[#03150c]/80 border-b border-emerald-900/40 backdrop-blur-sm px-4 sm:px-8 py-2.5 flex items-center justify-between shadow-md">
        {/* Logo & Brand */}
        <Link href="/beranda" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-full bg-yellow-400 border-2 border-yellow-200 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
            <span className="text-lg">🔺</span>
          </div>
          <div className="flex flex-col text-left">
            <span className="font-serif font-black tracking-wider text-yellow-400 text-base sm:text-lg leading-tight">
              RARA KUNING
            </span>
            <span className="text-[10px] sm:text-xs text-emerald-400 font-medium">
              Legenda Gunung Wilis Nganjuk
            </span>
          </div>
        </Link>

        {/* Breadcrumbs Navigation */}
        <nav className="hidden lg:flex items-center gap-2.5 text-xs font-medium text-emerald-200/90">
          <Link href="/beranda" className="text-yellow-400 font-bold border-b border-yellow-400 pb-0.5">
            Menu
          </Link>
          <span>›</span>
          <span className="hover:text-yellow-400 transition-colors cursor-pointer">Materi</span>
          <span>›</span>
          <Link href="/cptp" className="hover:text-yellow-400 transition-colors">
            CP/TP
          </Link>
          <span>›</span>
          <span className="hover:text-yellow-400 transition-colors cursor-pointer">Tokoh</span>
          <span>›</span>
          <span className="hover:text-yellow-400 transition-colors cursor-pointer">Misi</span>
          <span>›</span>
          <Link href="/play" className="hover:text-yellow-400 transition-colors">
            Ngulandara
          </Link>
          <span>›</span>
          <span className="hover:text-yellow-400 transition-colors cursor-pointer">Jurnal</span>
          <span>›</span>
          <span className="hover:text-yellow-400 transition-colors cursor-pointer">Grojogan</span>
          <span>›</span>
          <span className="hover:text-yellow-400 transition-colors cursor-pointer">Evaluasi</span>
        </nav>

        {/* Right side: Student status, audio & logout */}
        <div className="flex items-center gap-3">
          {studentProfile && (
            <div className="hidden sm:flex flex-col items-end text-right">
              <span className="text-xs font-bold text-yellow-300">
                👤 {studentProfile.nama_lengkap}
              </span>
              <span className="text-[10px] text-emerald-300">
                {studentProfile.nomor_induk ? `NIS: ${studentProfile.nomor_induk}` : 'Murid Haroku'}
              </span>
            </div>
          )}

          {/* Audio Toggle Button */}
          <button 
            type="button"
            onClick={() => setAudioPlaying(!audioPlaying)}
            className="w-8 h-8 rounded-full bg-emerald-950/80 border border-yellow-500/50 flex items-center justify-center text-yellow-400 hover:scale-105 active:scale-95 transition-transform shadow"
            title="Audio / Swara"
          >
            {audioPlaying ? '🔊' : '🔈'}
          </button>

          {/* Tombol Logout */}
          <button
            type="button"
            onClick={handleLogout}
            className="px-2.5 py-1 rounded-md bg-red-950/70 hover:bg-red-900 border border-red-700/80 text-red-200 text-[11px] font-bold transition-all"
            title="Metu"
          >
            Metu
          </button>
        </div>
      </header>

      {/* 
        CENTER AREA:
        Tombol dibuat 100% TRANSPARAN (Invisible Clickable Hitbox).
        Diletakkan tepat di atas tombol grafis bawaan background gambar.
        Saat di-hover kursor tetap berbentuk pointer dan memiliki efek kilau/klik halus 
        tanpa menutupi estetika tombol asli pada background.
      */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-4">
        
        {/* Spacer vertical agar posisi tepat menimpa tombol di latar gambar */}
        <div className="h-28 sm:h-36" />

        {/* HITBOX TOMBOL TRANSPARAN */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mt-14 sm:mt-24 w-full max-w-2xl">
          {/* Hitbox 1: Tombol MIWITI DOLANAN */}
          <Link
            href="/play"
            aria-label="Miwiti Dolanan"
            title="Miwiti Dolanan"
            className="w-full sm:w-[270px] h-[58px] sm:h-[64px] rounded-2xl bg-transparent opacity-0 hover:opacity-100 hover:bg-white/10 hover:ring-2 hover:ring-yellow-300/40 active:scale-95 transition-all duration-150 cursor-pointer"
          />

          {/* Hitbox 2: Tombol CP LAN TUJUAN PASINAON */}
          <Link
            href="/cptp"
            aria-label="CP Lan Tujuan Pasinaon"
            title="CP Lan Tujuan Pasinaon"
            className="w-full sm:w-[270px] h-[58px] sm:h-[64px] rounded-2xl bg-transparent opacity-0 hover:opacity-100 hover:bg-white/10 hover:ring-2 hover:ring-yellow-300/40 active:scale-95 transition-all duration-150 cursor-pointer"
          />
        </div>

        {/* Pintasan Tambahan Bawah */}
        <div className="flex items-center gap-4 mt-8 sm:mt-12 text-xs font-semibold text-emerald-200/90 bg-black/60 backdrop-blur-md px-5 py-2 rounded-full border border-emerald-700/60 shadow">
          <Link href="/profile" className="hover:text-yellow-400 flex items-center gap-1.5 transition-colors">
            <span>👤</span> Profil Murid
          </Link>
          <span className="text-emerald-600">•</span>
          <Link href="/cptp" className="hover:text-yellow-400 flex items-center gap-1.5 transition-colors">
            <span>📖</span> Capaian Pasinaon (CP/TP)
          </Link>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="relative z-10 w-full py-2 text-center text-[11px] text-emerald-400/70 bg-[#03150c]/85 border-t border-emerald-950">
        Haroku Adventure • Media Pasinaon Basa Jawa Legenda Grojogan Rara Kuning
      </footer>
    </div>
  );
}
